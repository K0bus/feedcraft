import { db } from '@feedcrafter/database';

export interface ModelUsageRecord {
  model: string;
  requestsToday: number;
  tokensToday: number;
  errorsToday: number;
  rateLimitHits: number;
  avgLatencyMs: number;
  lastUsedAt: string | null;
}

export interface RealtimeAiUsageStats {
  date: string;
  totalRequestsToday: number;
  totalTokensToday: number;
  totalErrorsToday: number;
  totalRateLimitHits: number;
  avgLatencyMs: number;
  models: Record<string, ModelUsageRecord>;
}

let inMemoryStats: RealtimeAiUsageStats = {
  date: new Date().toISOString().split('T')[0],
  totalRequestsToday: 0,
  totalTokensToday: 0,
  totalErrorsToday: 0,
  totalRateLimitHits: 0,
  avgLatencyMs: 0,
  models: {}
};

let isLoadedFromDb = false;

async function ensureStatsLoaded() {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!isLoadedFromDb || inMemoryStats.date !== todayStr) {
    try {
      const config = await db.systemConfig.findUnique({
        where: { key: `GEMINI_USAGE_${todayStr}` }
      });
      if (config?.value) {
        inMemoryStats = JSON.parse(config.value);
      } else {
        inMemoryStats = {
          date: todayStr,
          totalRequestsToday: 0,
          totalTokensToday: 0,
          totalErrorsToday: 0,
          totalRateLimitHits: 0,
          avgLatencyMs: 0,
          models: {}
        };
      }
      isLoadedFromDb = true;
    } catch (err) {
      console.warn('[AiUsageTracker] Impossible de charger les métriques BDD:', err);
    }
  }
}

async function persistStats() {
  const todayStr = inMemoryStats.date;
  try {
    await db.systemConfig.upsert({
      where: { key: `GEMINI_USAGE_${todayStr}` },
      update: { value: JSON.stringify(inMemoryStats) },
      create: { key: `GEMINI_USAGE_${todayStr}`, value: JSON.stringify(inMemoryStats) }
    });
  } catch (err) {
    console.warn('[AiUsageTracker] Impossible d\'enregistrer les métriques BDD:', err);
  }
}

export async function recordAiApiCall(payload: {
  model: string;
  tokensUsed?: number;
  status: 'success' | 'rate_limited' | 'error';
  latencyMs: number;
}) {
  await ensureStatsLoaded();

  const { model, tokensUsed = 0, status, latencyMs } = payload;
  const todayStr = new Date().toISOString().split('T')[0];

  if (inMemoryStats.date !== todayStr) {
    inMemoryStats = {
      date: todayStr,
      totalRequestsToday: 0,
      totalTokensToday: 0,
      totalErrorsToday: 0,
      totalRateLimitHits: 0,
      avgLatencyMs: 0,
      models: {}
    };
  }

  inMemoryStats.totalRequestsToday += 1;
  inMemoryStats.totalTokensToday += tokensUsed;

  if (status === 'error') inMemoryStats.totalErrorsToday += 1;
  if (status === 'rate_limited') inMemoryStats.totalRateLimitHits += 1;

  // Update rolling average latency
  const currentTotal = inMemoryStats.totalRequestsToday;
  inMemoryStats.avgLatencyMs = Math.round(
    ((inMemoryStats.avgLatencyMs * (currentTotal - 1)) + latencyMs) / currentTotal
  );

  // Model-specific stats
  if (!inMemoryStats.models[model]) {
    inMemoryStats.models[model] = {
      model,
      requestsToday: 0,
      tokensToday: 0,
      errorsToday: 0,
      rateLimitHits: 0,
      avgLatencyMs: 0,
      lastUsedAt: null
    };
  }

  const mStats = inMemoryStats.models[model];
  mStats.requestsToday += 1;
  mStats.tokensToday += tokensUsed;
  if (status === 'error') mStats.errorsToday += 1;
  if (status === 'rate_limited') mStats.rateLimitHits += 1;

  const mTotal = mStats.requestsToday;
  mStats.avgLatencyMs = Math.round(((mStats.avgLatencyMs * (mTotal - 1)) + latencyMs) / mTotal);
  mStats.lastUsedAt = new Date().toISOString();

  // Async persist
  persistStats().catch(() => {});
}

export async function getRealtimeAiUsage(): Promise<RealtimeAiUsageStats> {
  await ensureStatsLoaded();
  return inMemoryStats;
}
