import { GoogleGenAI } from '@google/genai';
import { GeminiTranslationResult, RawArticle, AdminAiModelConfig } from '@feedcrafter/shared';
import { db } from '@feedcrafter/database';
import { recordAiApiCall } from './aiUsageTracker.js';

export const DEFAULT_SYSTEM_PROMPT = `Tu es un traducteur expert en jeux vidéo pour des communautés Discord. Traduis le patch note / l'article suivant en français. Conserve les faits exacts, adopte un ton dynamique et engageant, et réorganise le texte avec des emojis et des puces pour un rendu visuel fluide sur Discord. Ne rajoute aucune information inventée.
RÈGLES DE FORMATAGE : Ne mets AUCUN faux séparateur ou ligne de tirets/égalités superflue (ex: n'utilise JAMAIS "＝＝＝", "===", "---", "───", "***", etc.). Garde uniquement un texte propre et aéré.`;

export const DEFAULT_CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemma-4-26b-a4b-it',
  'gemma-2-27b-it'
];

function cleanJson(str: string): string {
  return str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

export function sanitizeDiscordMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/^[=\-─*_~]{3,}\s*$/gm, '')
    .replace(/[＝=]{2,}/g, '')
    .replace(/[─\-_]{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Gets the configured system prompt from DB or default
 */
export async function getActiveSystemPrompt(): Promise<string> {
  try {
    const config = await db.systemConfig.findUnique({
      where: { key: 'GEMINI_SYSTEM_PROMPT' }
    });
    if (config?.value && config.value.trim().length > 0) {
      return config.value.trim();
    }
  } catch (err) {
    console.warn('[GeminiTranslatorService] Impossible de charger le prompt système depuis la BDD:', err);
  }
  return DEFAULT_SYSTEM_PROMPT;
}

/**
 * Gets the active AI model names in priority order from DB or default
 */
export async function getActiveModels(): Promise<string[]> {
  try {
    const config = await db.systemConfig.findUnique({
      where: { key: 'GEMINI_MODELS_CONFIG' }
    });
    if (config?.value) {
      const parsed: AdminAiModelConfig[] = JSON.parse(config.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const enabledModels = parsed
          .filter(m => m.enabled)
          .sort((a, b) => a.order - b.order)
          .map(m => m.name);
        if (enabledModels.length > 0) {
          return enabledModels;
        }
      }
    }
  } catch (err) {
    console.warn('[GeminiTranslatorService] Impossible de charger la liste des modèles depuis la BDD:', err);
  }
  return DEFAULT_CANDIDATE_MODELS;
}

/**
 * Translates and re-formats raw news content into engaging Discord-ready markdown using Gemini & Gemma AI models.
 */
export async function translateForDiscord(article: RawArticle): Promise<GeminiTranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey || apiKey.includes('your_gemini_api_key')) {
    console.warn('[GeminiTranslatorService] Clé GEMINI_API_KEY absente dans .env - Utilisation du traducteur de secours.');
    return buildFallbackTranslation(article);
  }

  const systemPrompt = await getActiveSystemPrompt();
  const candidateModels = await getActiveModels();

  const prompt = `
Article original en Anglais :
Titre : ${article.title}
Contenu :
${article.content}

Réponds STRICTEMENT sous la forme d'un objet JSON valide au format suivant :
{
  "translatedTitle": "Titre accrocheur en français avec emoji",
  "translatedContent": "Contenu structuré avec emojis, gras et puces pour Discord sans aucun séparateur superflu",
  "summary": "Résumé condensé en 2 phrases"
}
`;

  const ai = new GoogleGenAI({ apiKey });

  for (const model of candidateModels) {
    const startTime = Date.now();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `${systemPrompt}\n\n${prompt}`,
        config: {
          temperature: 0.3
        }
      });

      const latencyMs = Date.now() - startTime;
      const rawText = response.text || '';
      const usageMetadata = (response as any)?.usageMetadata;
      const tokensUsed = usageMetadata ? (usageMetadata.totalTokenCount || (usageMetadata.promptTokenCount + usageMetadata.candidatesTokenCount)) : 500;

      if (rawText) {
        const cleaned = cleanJson(rawText);
        const parsed: GeminiTranslationResult = JSON.parse(cleaned);

        if (parsed.translatedContent) {
          console.log(`[GeminiTranslatorService] Traduction réussie avec le modèle ${model} (${latencyMs}ms) !`);
          recordAiApiCall({ model, tokensUsed, status: 'success', latencyMs }).catch(() => {});
          return {
            translatedTitle: sanitizeDiscordMarkdown(parsed.translatedTitle || `⚡ ${article.title}`),
            translatedContent: sanitizeDiscordMarkdown(parsed.translatedContent),
            summary: sanitizeDiscordMarkdown(parsed.summary || 'Résumé des changements de la mise à jour.')
          };
        }
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errMsg = error.message || String(error);
      const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit');
      
      recordAiApiCall({
        model,
        tokensUsed: 0,
        status: isRateLimit ? 'rate_limited' : 'error',
        latencyMs
      }).catch(() => {});

      console.warn(`[GeminiTranslatorService Warning] Modèle ${model} indisponible (${error.status || error.message || error}). Basculement vers le modèle suivant...`);
    }
  }

  console.warn('[GeminiTranslatorService] Tous les modèles d\'IA ont échoué. Mode de secours activé.');
  return buildFallbackTranslation(article);
}

export function buildFallbackTranslation(article: RawArticle): GeminiTranslationResult {
  return {
    translatedTitle: `⚡ [Patch Note] ${article.title}`,
    translatedContent: `**Nouveautés & Patch Notes** :\n\n${article.content}`,
    summary: `Nouvelle mise à jour disponible pour ${article.title}.`
  };
}
