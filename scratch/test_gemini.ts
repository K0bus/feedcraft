import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/home/k0bus/Projects/feedcrafter/.env', override: true });

import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `Tu es un traducteur expert en jeux vidéo pour des communautés Discord. Traduis le patch note / l'article suivant en français. Conserve les faits exacts, adopte un ton dynamique et engageant, et réorganise le texte avec des emojis et des puces pour un rendu visuel fluide sur Discord. Ne rajoute aucune information inventée.`;

  const article = {
    title: 'Call II Arms-ory',
    content: 'Last week we released new weapon and sticker collections from our previous Call to Arms-ory. Fairy Tales weapon collection and Pop Art sticker collection.'
  };

  const prompt = `
Article original en Anglais :
Titre : ${article.title}
Contenu :
${article.content}

Réponds STRICTEMENT sous la forme d'un objet JSON valide au format suivant :
{
  "translatedTitle": "Titre accrocheur en français avec emoji",
  "translatedContent": "Contenu structuré avec emojis, gras et puces pour Discord",
  "summary": "Résumé condensé en 2 phrases"
}
`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: `${systemPrompt}\n\n${prompt}`
    });
    console.log('🎉 Gemma-4 Output:', res.text);
  } catch (err: any) {
    console.error('Error:', err);
  }
}

test();
