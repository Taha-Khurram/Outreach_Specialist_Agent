import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';
import logger from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: config.gemini.model });

async function generateEmail({ prospect, template }) {
  const prompt = `Write a personalized 100-word cold email to ${prospect.firstName} at ${prospect.company}.
Their title is ${prospect.title} in the ${prospect.industry} industry.
${prospect.funding ? `They recently raised a ${prospect.funding} round.` : ''}
${prospect.techStack?.length ? `Their tech stack includes: ${prospect.techStack.join(', ')}.` : ''}

Use this template as a guide but personalize it:
${template}

Requirements:
- Keep it under 100 words
- Sound human, not robotic
- Mention one specific thing about their company
- End with a clear call-to-action (15-min call)
- No generic flattery

Return JSON: {"subject": "...", "body": "..."}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error('Failed to parse email generation response', { error: err.message });
    throw err;
  }
}

async function classifyReply(replyText) {
  const prompt = `Classify this email reply into exactly one category and extract any explicit request.

Reply:
"""
${replyText}
"""

Categories:
- POSITIVE: interested, wants to talk, asks about services/pricing
- NEUTRAL: non-committal, asks clarifying questions, neither yes nor no
- NEGATIVE: not interested, asks to stop emailing, rude/dismissive
- UNSUBSCRIBE: explicitly asks to be removed from list

Return JSON: {"classification": "POSITIVE|NEUTRAL|NEGATIVE|UNSUBSCRIBE", "confidence": 0.0-1.0, "request": "extracted request or null", "hasQuestion": true/false}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error('Failed to parse classification response', { error: err.message });
    return { classification: 'NEUTRAL', confidence: 0, request: null, hasQuestion: false };
  }
}

async function generateReply({ originalEmail, classification, prospect }) {
  const calendlyLink = config.meeting.calendlyLink;

  const prompt = `Generate a reply to this email. Be concise, helpful, and human.

Context:
- We are a US-based web/mobile development team
- The prospect is ${prospect.name} at ${prospect.company}
- Classification: ${classification.classification}
- Their message: "${originalEmail}"
${classification.request ? `- They asked: ${classification.request}` : ''}
${classification.hasQuestion ? '- They asked a question, answer it briefly' : ''}

Rules:
- If positive: answer any question briefly, then suggest a 15-min call: ${calendlyLink}
- If neutral: ask one targeted clarifying question about their biggest tech challenge
- Keep under 80 words
- Sound like a real person, not a sales bot
- Don't use exclamation marks excessively

Return only the reply body text, no subject line needed.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export { generateEmail, classifyReply, generateReply };
