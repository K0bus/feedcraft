import { FastifyPluginAsync } from 'fastify';
import { db } from '@feedcrafter/database';
import { requireSuperAdmin } from '../middleware/admin.js';
import { GoogleGenAI } from '@google/genai';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_CANDIDATE_MODELS,
  getActiveModels,
  sanitizeDiscordMarkdown
} from '../services/geminiTranslator.js';
import { getRealtimeAiUsage, recordAiApiCall } from '../services/aiUsageTracker.js';
import {
  AdminUserDTO,
  AdminWebhookDTO,
  AdminWorkerStatusDTO,
  AdminAiModelConfig,
  AdminAiModelsDTO,
  AdminPromptConfigDTO
} from '@feedcrafter/shared';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Protect all admin routes with requireSuperAdmin middleware
  fastify.addHook('onRequest', requireSuperAdmin);

  // Redis & BullMQ Setup for worker status
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = Number(process.env.REDIS_PORT) || 6379;
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  let redisConnection: Redis | null = null;
  let newsFetchQueue: Queue | null = null;
  let discordDispatchQueue: Queue | null = null;

  try {
    redisConnection = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      lazyConnect: true,
      maxRetriesPerRequest: null
    });

    newsFetchQueue = new Queue('news-fetch-queue', { connection: redisConnection });
    discordDispatchQueue = new Queue('discord-dispatch-queue', { connection: redisConnection });
  } catch (err) {
    console.warn('[Admin API] Failed to initialize Redis/BullMQ connection:', err);
  }

  // ==========================================
  // 👥 USERS MANAGEMENT
  // ==========================================
  fastify.get('/users', async () => {
    const users = await db.user.findMany({
      include: {
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userDTOs: AdminUserDTO[] = users.map((u: any) => ({
      id: u.id,
      discordId: u.discordId,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      createdAt: u.createdAt.toISOString(),
      subscriptionsCount: u._count.subscriptions
    }));

    return { users: userDTOs };
  });

  // ==========================================
  // 🔗 WEBHOOKS & SUBSCRIPTIONS MANAGEMENT
  // ==========================================
  fastify.get('/webhooks', async () => {
    const subscriptions = await db.subscription.findMany({
      include: {
        user: true,
        game: true,
        dispatchLogs: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const webhooks: AdminWebhookDTO[] = subscriptions.map((sub: any) => {
      const lastLog = sub.dispatchLogs[0];
      return {
        id: sub.id,
        userId: sub.userId,
        userName: sub.user.username,
        gameId: sub.gameId,
        gameName: sub.game.name,
        gameCoverUrl: sub.game.coverUrl,
        discordWebhookUrl: sub.discordWebhookUrl,
        guildName: sub.guildName,
        status: sub.status,
        createdAt: sub.createdAt.toISOString(),
        lastDispatchStatus: lastLog ? lastLog.status : null,
        lastDispatchAt: lastLog ? lastLog.sentAt.toISOString() : null
      };
    });

    return { webhooks };
  });

  // POST /api/admin/webhooks/:id/test - Test a webhook
  fastify.post<{ Params: { id: string } }>('/webhooks/:id/test', async (request, reply) => {
    const { id } = request.params;
    const subscription = await db.subscription.findUnique({
      where: { id },
      include: { game: true }
    });

    if (!subscription) {
      return reply.status(404).send({ error: 'Abonnement introuvable.' });
    }

    const testPayload = {
      embeds: [
        {
          title: `🧪 [Test Webhook - Admin] ${subscription.game.name}`,
          description: 'Ceci est un message de test envoyé depuis le panneau d\'administration FeedCrafter.',
          color: 0x10b981,
          thumbnail: subscription.game.artworkUrl ? { url: subscription.game.artworkUrl } : undefined,
          footer: { text: 'FeedCrafter Admin Test' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const res = await fetch(subscription.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (!res.ok) {
        throw new Error(`Réponse Discord Webhook: HTTP ${res.status} ${res.statusText}`);
      }

      return { success: true, message: 'Message de test envoyé avec succès sur Discord !' };
    } catch (err: any) {
      return reply.status(400).send({ error: `Échec d'envoi du webhook: ${err.message}` });
    }
  });

  // PATCH /api/admin/webhooks/:id/toggle - Toggle status
  fastify.patch<{ Params: { id: string } }>('/webhooks/:id/toggle', async (request, reply) => {
    const { id } = request.params;
    const subscription = await db.subscription.findUnique({ where: { id } });

    if (!subscription) {
      return reply.status(404).send({ error: 'Abonnement introuvable.' });
    }

    const newStatus = subscription.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await db.subscription.update({
      where: { id },
      data: { status: newStatus }
    });

    return { success: true, status: updated.status };
  });

  // ==========================================
  // ⚙️ WORKERS & QUEUES STATUS
  // ==========================================
  fastify.get('/workers', async () => {
    let workerStatus: AdminWorkerStatusDTO = {
      newsFetchQueue: { waiting: 0, active: 0, completed: 0, failed: 0 },
      discordDispatchQueue: { waiting: 0, active: 0, completed: 0, failed: 0 },
      status: 'offline'
    };

    try {
      if (newsFetchQueue && discordDispatchQueue) {
        const newsCounts = await newsFetchQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
        const dispatchCounts = await discordDispatchQueue.getJobCounts('waiting', 'active', 'completed', 'failed');

        workerStatus = {
          newsFetchQueue: {
            waiting: newsCounts.waiting || 0,
            active: newsCounts.active || 0,
            completed: newsCounts.completed || 0,
            failed: newsCounts.failed || 0
          },
          discordDispatchQueue: {
            waiting: dispatchCounts.waiting || 0,
            active: dispatchCounts.active || 0,
            completed: dispatchCounts.completed || 0,
            failed: dispatchCounts.failed || 0
          },
          status: 'online'
        };
      }
    } catch (err) {
      console.warn('[Admin API] Error querying BullMQ queues:', err);
      workerStatus.status = 'degraded';
    }

    return workerStatus;
  });

  // POST /api/admin/workers/trigger - Trigger manual pipeline check
  fastify.post('/workers/trigger', async () => {
    try {
      if (newsFetchQueue) {
        await newsFetchQueue.add('manual-fetch-job', { trigger: 'admin', timestamp: new Date().toISOString() });
      }
      return { success: true, message: 'Scan et synchronisation lancés avec succès dans la file worker !' };
    } catch (err: any) {
      return { success: false, message: `Impossible de lancer la tâche: ${err.message}` };
    }
  });

function formatTokenCount(count?: number): string {
  if (!count) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M tokens`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}k tokens`;
  return `${count} tokens`;
}

function getEstimatedRateLimits(modelName: string) {
  const name = modelName.toLowerCase();
  if (name.includes('pro')) {
    return { rpm: '360 RPM', rpd: '500 RPD', tpm: '2M TPM' };
  }
  if (name.includes('lite')) {
    return { rpm: '1 500 RPM', rpd: '10 000 RPD', tpm: '1M TPM' };
  }
  if (name.includes('flash')) {
    return { rpm: '1 500 RPM', rpd: '10 000 RPD', tpm: '1M TPM' };
  }
  if (name.includes('gemma')) {
    return { rpm: '30 RPM', rpd: '1 500 RPD', tpm: '500k TPM' };
  }
  return { rpm: '1 000 RPM', rpd: '5 000 RPD', tpm: '1M TPM' };
}

  // GET /api/admin/ai/models/available - Full models list from Google API + Defaults
  fastify.get('/ai/models/available', async () => {
    const apiKey = process.env.GEMINI_API_KEY || '';
    let apiModels: any[] = [];

    if (apiKey && !apiKey.includes('your_gemini_api_key')) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const paginator = await ai.models.list();
        const modelsList: any[] = [];

        if (paginator && Symbol.asyncIterator in Object(paginator)) {
          for await (const m of (paginator as any)) {
            modelsList.push(m);
          }
        } else if (Array.isArray((paginator as any)?.models)) {
          modelsList.push(...(paginator as any).models);
        } else if (Array.isArray((paginator as any)?.pageInternal)) {
          modelsList.push(...(paginator as any).pageInternal);
        }

        apiModels = modelsList.map((m: any) => {
          const rawName = m.name ? m.name.replace(/^models\//, '') : '';
          const limits = getEstimatedRateLimits(rawName);
          const inLimit = m.inputTokenLimit || (rawName.includes('pro') || rawName.includes('flash') ? 1048576 : 128000);
          const outLimit = m.outputTokenLimit || (rawName.includes('pro') || rawName.includes('flash') ? 65536 : 8192);
          return {
            name: rawName,
            displayName: m.displayName || rawName.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            description: m.description || '',
            version: m.version || '',
            supportedGenerationMethods: m.supportedActions || m.supportedGenerationMethods || [],
            inputTokenLimit: inLimit,
            outputTokenLimit: outLimit,
            inputTokenFormatted: formatTokenCount(inLimit),
            outputTokenFormatted: formatTokenCount(outLimit),
            rpm: limits.rpm,
            rpd: limits.rpd,
            tpm: limits.tpm
          };
        }).filter(m => m.name);
      } catch (err) {
        console.warn('[Admin API] Error fetching available models from Gemini API:', err);
      }
    }

    const defaultList = DEFAULT_CANDIDATE_MODELS.map((name) => {
      const limits = getEstimatedRateLimits(name);
      return {
        name,
        displayName: name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: 'Modèle Gemini prédéfini dans FeedCrafter',
        version: 'latest',
        supportedGenerationMethods: ['generateContent'],
        inputTokenLimit: 1048576,
        outputTokenLimit: 65536,
        inputTokenFormatted: '1M tokens',
        outputTokenFormatted: '64k tokens',
        rpm: limits.rpm,
        rpd: limits.rpd,
        tpm: limits.tpm
      };
    });

    const nameSet = new Set(apiModels.map((m) => m.name));
    for (const defItem of defaultList) {
      if (!nameSet.has(defItem.name)) {
        apiModels.push(defItem);
      }
    }

    return { availableModels: apiModels };
  });

  // ==========================================
  // 🤖 AI MODELS DYNAMIC ADMINISTRATION
  // ==========================================
  fastify.get('/ai/models', async (): Promise<AdminAiModelsDTO> => {
    const apiKey = process.env.GEMINI_API_KEY || '';
    let fetchedModelMap = new Map<string, any>();

    // 1. Fetch live models list from Gemini API if key is present
    if (apiKey && !apiKey.includes('your_gemini_api_key')) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const paginator = await ai.models.list();
        const modelsList: any[] = [];

        if (paginator && Symbol.asyncIterator in Object(paginator)) {
          for await (const m of (paginator as any)) {
            modelsList.push(m);
          }
        } else if (Array.isArray((paginator as any)?.models)) {
          modelsList.push(...(paginator as any).models);
        } else if (Array.isArray((paginator as any)?.pageInternal)) {
          modelsList.push(...(paginator as any).pageInternal);
        }

        for (const m of modelsList) {
          const rawName = m.name ? m.name.replace(/^models\//, '') : '';
          if (rawName) {
            fetchedModelMap.set(rawName, m);
          }
        }
      } catch (err) {
        console.warn('[Admin API] Dynamic model fetch from Gemini API failed:', err);
      }
    }

    const fetchedNames = Array.from(fetchedModelMap.keys());
    const allAvailableNames = Array.from(new Set([...DEFAULT_CANDIDATE_MODELS, ...fetchedNames]));

    // 2. Fetch saved configuration from DB
    let savedConfig: AdminAiModelConfig[] = [];
    try {
      const configRecord = await db.systemConfig.findUnique({
        where: { key: 'GEMINI_MODELS_CONFIG' }
      });
      if (configRecord?.value) {
        savedConfig = JSON.parse(configRecord.value);
      }
    } catch (err) {
      console.warn('[Admin API] Failed reading GEMINI_MODELS_CONFIG:', err);
    }

    // Helper to enrich model config with limits
    const enrichModelConfig = (m: AdminAiModelConfig): AdminAiModelConfig => {
      const rawObj = fetchedModelMap.get(m.name);
      const limits = getEstimatedRateLimits(m.name);
      const inLimit = rawObj?.inputTokenLimit || m.inputTokenLimit || 1048576;
      const outLimit = rawObj?.outputTokenLimit || m.outputTokenLimit || 65536;
      return {
        ...m,
        inputTokenLimit: inLimit,
        outputTokenLimit: outLimit,
        inputTokenFormatted: formatTokenCount(inLimit),
        outputTokenFormatted: formatTokenCount(outLimit),
        rpm: limits.rpm,
        rpd: limits.rpd,
        tpm: limits.tpm
      };
    };

    if (savedConfig.length > 0) {
      const savedNames = new Set(savedConfig.map(m => m.name));
      let maxOrder = Math.max(...savedConfig.map(m => m.order), 0);

      for (const name of allAvailableNames) {
        if (!savedNames.has(name)) {
          maxOrder += 1;
          savedConfig.push({
            name,
            displayName: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            enabled: false,
            order: maxOrder
          });
        }
      }

      savedConfig.sort((a, b) => a.order - b.order);
      return { models: savedConfig.map(enrichModelConfig) };
    }

    const resultModels: AdminAiModelConfig[] = allAvailableNames.map((name, idx) => enrichModelConfig({
      name,
      displayName: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      enabled: true,
      order: idx + 1
    }));

    return { models: resultModels };
  });

  // GET /api/admin/ai/usage - Real-time Google AI Studio Usage & Quota Stats
  fastify.get('/ai/usage', async () => {
    const stats = await getRealtimeAiUsage();
    return { stats };
  });

  // PUT /api/admin/ai/models - Save models configuration
  fastify.put<{ Body: { models: AdminAiModelConfig[] } }>('/ai/models', async (request, reply) => {
    const { models } = request.body;

    if (!Array.isArray(models)) {
      return reply.status(400).send({ error: 'Format invalide (tableau de modèles requis).' });
    }

    await db.systemConfig.upsert({
      where: { key: 'GEMINI_MODELS_CONFIG' },
      update: { value: JSON.stringify(models) },
      create: { key: 'GEMINI_MODELS_CONFIG', value: JSON.stringify(models) }
    });

    return { success: true, message: 'Configuration des modèles d\'IA enregistrée !' };
  });

  // ==========================================
  // 📝 SYSTEM PROMPT ADMINISTRATION
  // ==========================================
  fastify.get('/ai/prompt', async (): Promise<AdminPromptConfigDTO> => {
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;

    try {
      const config = await db.systemConfig.findUnique({
        where: { key: 'GEMINI_SYSTEM_PROMPT' }
      });
      if (config?.value) {
        systemPrompt = config.value;
      }
    } catch (err) {
      console.warn('[Admin API] Erreur lors de la lecture du prompt système:', err);
    }

    return {
      systemPrompt,
      defaultPrompt: DEFAULT_SYSTEM_PROMPT
    };
  });

  // PUT /api/admin/ai/prompt - Update system prompt
  fastify.put<{ Body: { systemPrompt: string } }>('/ai/prompt', async (request, reply) => {
    const { systemPrompt } = request.body;

    if (typeof systemPrompt !== 'string') {
      return reply.status(400).send({ error: 'Le champ systemPrompt doit être une chaîne de caractères.' });
    }

    await db.systemConfig.upsert({
      where: { key: 'GEMINI_SYSTEM_PROMPT' },
      update: { value: systemPrompt.trim() },
      create: { key: 'GEMINI_SYSTEM_PROMPT', value: systemPrompt.trim() }
    });

    return { success: true, message: 'Prompt système enregistré avec succès !' };
  });

  // POST /api/admin/ai/prompt/test - Test prompt execution on sample data
  fastify.post<{ Body: { systemPrompt?: string; sampleTitle?: string; sampleContent?: string; model?: string } }>(
    '/ai/prompt/test',
    async (request, reply) => {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey || apiKey.includes('your_gemini_api_key')) {
        return reply.status(400).send({ error: 'GEMINI_API_KEY non configurée sur le serveur.' });
      }

      const promptToTest = request.body.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      const sampleTitle = request.body.sampleTitle || 'Update 1.0.4 - Major Performance & Bug Fixes';
      const sampleContent =
        request.body.sampleContent ||
        'We are thrilled to release update 1.0.4 today! Fixed crash issues on startup, improved framerate on modern GPUs, and added 3 new festive weapons.';

      const activeModels = await getActiveModels();
      const candidateModels = request.body.model
        ? Array.from(new Set([request.body.model, ...activeModels]))
        : activeModels;

      const userPrompt = `
Article original en Anglais :
Titre : ${sampleTitle}
Contenu :
${sampleContent}

Réponds STRICTEMENT sous la forme d'un objet JSON valide au format suivant :
{
  "translatedTitle": "Titre accrocheur en français avec emoji",
  "translatedContent": "Contenu structuré avec emojis, gras et puces pour Discord sans aucun séparateur superflu",
  "summary": "Résumé condensé en 2 phrases"
}
`;

      const ai = new GoogleGenAI({ apiKey });
      let lastError: any = null;

      for (const modelToUse of candidateModels) {
        const startTime = Date.now();
        try {
          const response = await ai.models.generateContent({
            model: modelToUse,
            contents: `${promptToTest}\n\n${userPrompt}`,
            config: { temperature: 0.3 }
          });

          const latencyMs = Date.now() - startTime;
          const usageMetadata = (response as any)?.usageMetadata;
          const tokensUsed = usageMetadata ? (usageMetadata.totalTokenCount || (usageMetadata.promptTokenCount + usageMetadata.candidatesTokenCount)) : 450;
          
          recordAiApiCall({ model: modelToUse, tokensUsed, status: 'success', latencyMs }).catch(() => {});

          const rawText = response.text || '';
          let parsed: any = null;
          try {
            const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = null;
          }

          return {
            usedModel: modelToUse,
            rawOutput: rawText,
            parsedOutput: parsed
              ? {
                  translatedTitle: sanitizeDiscordMarkdown(parsed.translatedTitle || ''),
                  translatedContent: sanitizeDiscordMarkdown(parsed.translatedContent || ''),
                  summary: sanitizeDiscordMarkdown(parsed.summary || '')
                }
              : null
          };
        } catch (err: any) {
          const latencyMs = Date.now() - startTime;
          const errMsg = err.message || String(err);
          const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit');
          recordAiApiCall({ model: modelToUse, tokensUsed: 0, status: isRateLimit ? 'rate_limited' : 'error', latencyMs }).catch(() => {});

          console.warn(`[Admin API Prompt Test] Modèle ${modelToUse} non disponible pour le test:`, err.message || err);
          lastError = err;
        }
      }

      return reply.status(500).send({
        error: `Erreur lors de l'exécution du test Gemini sur les modèles (${candidateModels.join(', ')}): ${lastError?.message || lastError}`
      });
    }
  );
};

export default adminRoutes;
