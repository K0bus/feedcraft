// FeedCrafter Shared TypeScript Interfaces and Data Contracts

export enum NewsSource {
  STEAM = 'STEAM',
  EPIC = 'EPIC',
  RSS = 'RSS',
  RAWG = 'RAWG',
  IGDB = 'IGDB'
}

export interface UserGuildDTO {
  id: string;
  guildId: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  permissions?: string | null;
}

export interface UserDTO {
  id: string;
  discordId: string;
  username: string;
  email?: string | null;
  avatar?: string | null;
  createdAt: string;
  isSuperAdmin?: boolean;
  guilds?: UserGuildDTO[];
}

export interface GameDTO {
  id?: string;
  igdbId: number;
  name: string;
  slug?: string | null;
  coverUrl?: string | null;
  artworkUrl?: string | null;
  steamAppId?: string | null;
  epicSlug?: string | null;
  bnetSlug?: string | null;
  summary?: string | null;
  platform?: string;
  isSubscribed?: boolean;
}

export interface SubscriptionDTO {
  id: string;
  userId: string;
  gameId: string;
  discordWebhookUrl: string;
  guildId?: string | null;
  guildName?: string | null;
  guildIcon?: string | null;
  status: string;
  createdAt: string;
  game?: GameDTO;
}

export interface CreateSubscriptionPayload {
  igdbId: number;
  gameName: string;
  coverUrl?: string;
  artworkUrl?: string;
  steamAppId?: string;
  epicSlug?: string;
  bnetSlug?: string;
  discordWebhookUrl: string;
  guildId?: string;
  guildName?: string;
  guildIcon?: string;
}

export interface InspectWebhookResult {
  guildId: string | null;
  guildName: string | null;
  guildIcon: string | null;
  channelId: string | null;
  channelName: string | null;
  matchedGuild: UserGuildDTO | null;
}

// Raw News Article Structure
export interface RawArticle {
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string | null;
}

// News Preview API Request & Response Contracts
export interface NewsPreviewRequest {
  gameId?: string;
  igdbId?: number;
  steamAppId?: string;
  gameName?: string;
}

export interface NewsPreviewResponse {
  raw: RawArticle;
  translated: {
    title: string;
    content: string;
    summary: string;
  };
  discordEmbed: {
    title: string;
    description: string;
    color: number;
    url: string;
    thumbnail?: { url: string };
    image?: { url: string };
    footerText?: string;
    timestamp?: string;
  };
}

// Twitch & IGDB API Response Structures
export interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface IGDBExternalGame {
  id: number;
  category?: number;
  external_game_source?: number;
  uid: string;
  url?: string;
}

export interface IGDBRawGame {
  id: number;
  name: string;
  category?: number;
  game_type?: number;
  parent_game?: number;
  version_parent?: number;
  follows?: number;
  rating_count?: number;
  summary?: string;
  storyline?: string;
  cover?: {
    id: number;
    url: string;
  };
  artworks?: Array<{ id: number; url: string }>;
  screenshots?: Array<{ id: number; url: string }>;
  first_release_date?: number;
  rating?: number;
  aggregated_rating?: number;
  genres?: Array<{ id: number; name: string }>;
  game_modes?: Array<{ id: number; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  external_games?: IGDBExternalGame[];
  platforms?: Array<{ id: number; name: string }>;
  involved_companies?: Array<{
    id: number;
    developer?: boolean;
    publisher?: boolean;
    company?: { name: string };
  }>;
  url?: string;
}

export interface IGDBGameDetailsResponse {
  normalized: GameDTO & {
    storyline?: string | null;
    firstReleaseDate?: string | null;
    rating?: number | null;
    aggregatedRating?: number | null;
    follows?: number | null;
    genres?: string[];
    gameModes?: string[];
    themes?: string[];
    developers?: string[];
    publishers?: string[];
    igdbUrl?: string | null;
    artworks?: string[];
    screenshots?: string[];
    externalLinks?: Array<{ category: string; name: string; url: string }>;
  };
  raw: any;
}


// Queue Job Contracts (BullMQ)
export interface FetchNewsJobData {
  gameId: string;
  source: NewsSource;
  steamAppId?: string;
  epicSlug?: string;
  rssUrl?: string;
}

export interface TranslateNewsJobData {
  newsFeedId: string;
  targetLanguage: string;
  rawTitle: string;
  rawContent: string;
}

export interface DispatchDiscordWebhookJobData {
  subscriptionId: string;
  discordWebhookUrl: string;
  translatedTitle: string;
  translatedContent: string;
  summary?: string;
  gameName: string;
  gameCoverUrl?: string;
  artworkUrl?: string | null;
  imageUrl?: string | null;
  newsUrl: string;
  publishedAt: string;
}

// Gemini AI Prompt Response Schema
export interface GeminiTranslationResult {
  translatedTitle: string;
  translatedContent: string;
  summary: string;
  modelUsed?: string | null;
  detectedLanguage?: string;
}

export interface DispatchLogDTO {
  id: string;
  subscriptionId: string;
  newsFeedId: string;
  translatedTitle?: string | null;
  translatedContent?: string | null;
  summary?: string | null;
  modelUsed?: string | null;
  status: string;
  errorMessage?: string | null;
  sentAt: string;
  subscription?: SubscriptionDTO;
  newsFeed?: {
    id: string;
    title: string;
    content: string;
    url: string;
    publishedAt: string;
    imageUrl?: string | null;
    source: string;
  };
}

// Admin Interfaces
export interface AdminUserDTO {
  id: string;
  discordId: string;
  username: string;
  email?: string | null;
  avatar?: string | null;
  createdAt: string;
  subscriptionsCount: number;
}

export interface AdminWebhookDTO {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  gameName: string;
  gameCoverUrl?: string | null;
  discordWebhookUrl: string;
  guildId?: string | null;
  guildName?: string | null;
  guildIcon?: string | null;
  status: string;
  createdAt: string;
  lastDispatchStatus?: string | null;
  lastDispatchAt?: string | null;
}

export interface AdminWorkerStatusDTO {
  newsFetchQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  discordDispatchQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  status: 'online' | 'degraded' | 'offline';
}

export interface AdminAiModelConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  order: number;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  inputTokenFormatted?: string;
  outputTokenFormatted?: string;
  rpm?: string;
  rpd?: string;
  tpm?: string;
}

export interface AdminAiModelsDTO {
  models: AdminAiModelConfig[];
}

export interface AdminPromptConfigDTO {
  systemPrompt: string;
  defaultPrompt: string;
}

