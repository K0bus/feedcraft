import { GoogleGenAI } from '@google/genai';
import { db } from '@feedcrafter/database';
import { GeminiTranslationResult } from '@feedcrafter/shared';

function cleanJson(str: string): string {
  return str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

function sanitizeDiscordMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/^[=\-─*_~]{3,}\s*$/gm, '')
    .replace(/[＝=]{2,}/g, '')
    .replace(/[─\-_]{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Translates news feed content into the target language using Gemini & Gemma AI.
 * Implements a cache lookup in `NewsCache` to prevent redundant API calls.
 */
export async function translateAndSummarizeNews(
  newsFeedId: string,
  title: string,
  content: string,
  targetLanguage: string = 'fr'
): Promise<GeminiTranslationResult> {
  // 1. Check DB Cache
  try {
    const cached = await db.newsCache.findUnique({
      where: {
        newsFeedId_language: {
          newsFeedId,
          language: targetLanguage
        }
      }
    });

    if (cached) {
      console.log(`[Gemini Cache Hit] NewsFeed ${newsFeedId} (${targetLanguage}) loaded from cache.`);
      return {
        translatedTitle: sanitizeDiscordMarkdown(cached.translatedTitle),
        translatedContent: sanitizeDiscordMarkdown(cached.translatedContent),
        summary: sanitizeDiscordMarkdown(cached.summary || '')
      };
    }
  } catch (err) {
    console.warn('[NewsCache Search Warning]', err);
  }

  const apiKey = process.env.GEMINI_API_KEY || '';

  // Check for missing or placeholder Gemini API key before attempting request
  if (!apiKey || apiKey.includes('your_gemini_api_key')) {
    console.warn(`[Worker Gemini Warning] Clé GEMINI_API_KEY absente dans .env - Traduction de secours pour ${newsFeedId}`);
    return {
      translatedTitle: `⚡ ${title}`,
      translatedContent: content,
      summary: 'Mise à jour automatique.'
    };
  }

  // 2. Call Gemini API
  console.log(`[Gemini API Request] Translating NewsFeed ${newsFeedId} to ${targetLanguage}...`);

  const prompt = `
Tu es un traducteur et rédacteur expert en jeux vidéo pour Discord.
Traduis le titre et le contenu de la mise à jour/patch note suivante dans la langue cible : "${targetLanguage}".
Fournis également un résumé concis (2-3 phrases) adapté pour une annonce Discord.

RÈGLES DE FORMATAGE DISCORD :
- Ne mets AUCUN faux séparateur ou ligne de tirets/égalités superflue (ex: n'utilise JAMAIS "＝＝＝", "===", "---", "───", "***", etc.).
- Ne garde qu'un texte propre, lisible et aéré, structuré uniquement avec des emojis, des titres en gras (**titre**) et des puces Markdown.
- Retire les textes de remerciements ou autres textes non pertinents.

Titre original: ${title}
Contenu original: ${content}

Réponds STRICTEMENT au format JSON avec les clés suivantes :
{
  "translatedTitle": "Titre traduit",
  "translatedContent": "Contenu traduit au format Markdown Discord propre",
  "summary": "Résumé concis"
}
`;

  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemma-4-26b-a4b-it',
    'gemini-2.0-flash'
  ];
  const ai = new GoogleGenAI({ apiKey });

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const rawText = response.text || '';
      if (rawText) {
        const cleaned = cleanJson(rawText);
        const parsed: GeminiTranslationResult = JSON.parse(cleaned);

        if (parsed.translatedContent) {
          const finalTitle = sanitizeDiscordMarkdown(parsed.translatedTitle || title);
          const finalContent = sanitizeDiscordMarkdown(parsed.translatedContent || content);
          const finalSummary = sanitizeDiscordMarkdown(parsed.summary || '');

          // Save to NewsCache
          try {
            await db.newsCache.create({
              data: {
                newsFeedId,
                language: targetLanguage,
                translatedTitle: finalTitle,
                translatedContent: finalContent,
                summary: finalSummary
              }
            });
          } catch (dbErr) {
            console.warn('[NewsCache Save Warning]', dbErr);
          }

          return {
            translatedTitle: finalTitle,
            translatedContent: finalContent,
            summary: finalSummary
          };
        }
      }
    } catch (error: any) {
      console.warn(`[Worker Gemini Warning] Échec du modèle ${model}: ${error.message || error}`);
    }
  }

  return {
    translatedTitle: title,
    translatedContent: content,
    summary: 'Résumé indisponible.'
  };
}
