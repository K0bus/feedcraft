import { GoogleGenAI } from '@google/genai';
import { GeminiTranslationResult, RawArticle } from '@feedcrafter/shared';

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
 * Translates and re-formats raw news content into engaging Discord-ready markdown using Gemini & Gemma AI models.
 */
export async function translateForDiscord(article: RawArticle): Promise<GeminiTranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  // Check for missing or placeholder Gemini API key before attempting request
  if (!apiKey || apiKey.includes('your_gemini_api_key')) {
    console.warn('[GeminiTranslatorService] Clé GEMINI_API_KEY absente dans .env - Utilisation du traducteur de secours.');
    return buildFallbackTranslation(article);
  }

  const systemPrompt = `Tu es un traducteur expert en jeux vidéo pour des communautés Discord. Traduis le patch note / l'article suivant en français. Conserve les faits exacts, adopte un ton dynamique et engageant, et réorganise le texte avec des emojis et des puces pour un rendu visuel fluide sur Discord. Ne rajoute aucune information inventée.\nRÈGLES DE FORMATAGE : Ne mets AUCUN faux séparateur ou ligne de tirets/égalités superflue (ex: n'utilise JAMAIS "＝＝＝", "===", "---", "───", "***", etc.). Garde uniquement un texte propre et aéré.`;

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
        contents: `${systemPrompt}\n\n${prompt}`,
        config: {
          temperature: 0.3
        }
      });

      const rawText = response.text || '';
      if (rawText) {
        const cleaned = cleanJson(rawText);
        const parsed: GeminiTranslationResult = JSON.parse(cleaned);

        if (parsed.translatedContent) {
          console.log(`[GeminiTranslatorService] Traduction réussie avec le modèle ${model} !`);
          return {
            translatedTitle: sanitizeDiscordMarkdown(parsed.translatedTitle || `⚡ ${article.title}`),
            translatedContent: sanitizeDiscordMarkdown(parsed.translatedContent),
            summary: sanitizeDiscordMarkdown(parsed.summary || 'Résumé des changements de la mise à jour.')
          };
        }
      }
    } catch (error: any) {
      console.warn(`[GeminiTranslatorService Warning] Modèle ${model} indisponible (${error.status || error.message || error}). Basculement vers le modèle suivant...`);
    }
  }

  console.warn('[GeminiTranslatorService] Tous les modèles d\'IA ont échoué. Mode de secours activé.');
  return buildFallbackTranslation(article);
}

function buildFallbackTranslation(article: RawArticle): GeminiTranslationResult {
  return {
    translatedTitle: `⚡ [Patch Note] ${article.title}`,
    translatedContent: `**Nouveautés & Patch Notes** :\n\n${article.content}`,
    summary: `Nouvelle mise à jour disponible pour ${article.title}.`
  };
}
