// FeedCrafter Shared TypeScript Interfaces and Data Contracts

export enum NewsSource {
  STEAM = 'STEAM',
  EPIC = 'EPIC',
  RSS = 'RSS',
  RAWG = 'RAWG',
  IGDB = 'IGDB'
}

export interface UserDTO {
  id: string;
  discordId: string;
  username: string;
  email?: string | null;
  avatar?: string | null;
  createdAt: string;
}

export interface GameDTO {
  id?: string;
  igdbId: number;
  name: string;
  slug?: string | null;
  coverUrl?: string | null;
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
  guildName?: string | null;
  status: string;
  createdAt: string;
  game?: GameDTO;
}

export interface CreateSubscriptionPayload {
  igdbId: number;
  gameName: string;
  coverUrl?: string;
  steamAppId?: string;
  epicSlug?: string;
  bnetSlug?: string;
  discordWebhookUrl: string;
  guildName?: string;
}

// Raw News Article Structure
export interface RawArticle {
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  author?: string;
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
  category: number; // 1 = Steam, 11 = Epic Games, 14 = GOG, etc.
  uid: string;
}

export interface IGDBRawGame {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    id: number;
    url: string;
  };
  external_games?: IGDBExternalGame[];
  platforms?: Array<{ id: number; name: string }>;
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
  newsUrl: string;
  publishedAt: string;
}

// Gemini AI Prompt Response Schema
export interface GeminiTranslationResult {
  translatedTitle: string;
  translatedContent: string;
  summary: string;
  detectedLanguage?: string;
}
