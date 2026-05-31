import { generateReply } from '../services/ai.js';
import { replyToThread } from '../services/gmail.js';
import { updateProspectStatus, logInteraction } from '../services/sheets.js';
import { getAvailableSlots, createMeeting } from '../services/calendar.js';
import config from '../config.js';
import logger from '../utils/logger.js';

async function handleClassifiedReplies(classifiedReplies, prospects) {
  const results = [];

  for (const reply of classifiedReplies) {
    const prospect = prospects.find(p => p.email && reply.from.includes(p.email));
    if (!prospect) {
      logger.warn('No matching prospect for reply', { from: reply.from });
      results.push({ reply, action: 'skipped', reason: 'no_matching_prospect' });
      continue;
    }

    try {
      const result = await handleSingleReply(reply, prospect);
      results.push(result);
    } catch (err) {
      logger.error('Failed to handle reply', { from: reply.from, error: err.message });
      results.push({ reply, action: 'error', reason: err.message });
    }
  }

  return results;
}

async function handleSingleReply(reply, prospect) {
  const { classification, confidence, hasQuestion } = reply;

  if (classification === 'UNSUBSCRIBE') {
    await updateProspectStatus(prospect.id, 'unsubscribed');
    await logInteraction({
      prospectId: prospect.id,
      type: 'unsubscribe',
      subject: reply.subject,
      status: 'unsubscribed',
      notes: 'Prospect requested removal'
    });
    logger.info('Prospect unsubscribed', { prospectId: prospect.id });
    return { reply, action: 'unsubscribed', prospect };
  }

  if (classification === 'NEGATIVE') {
    await updateProspectStatus(prospect.id, 'replied');
    await logInteraction({
      prospectId: prospect.id,
      type: 'negative_reply',
      subject: reply.subject,
      status: 'replied',
      notes: 'Negative response - stopping outreach'
    });
    return { reply, action: 'stopped', prospect };
  }

  if (confidence < config.agent.confidenceThreshold) {
    await logInteraction({
      prospectId: prospect.id,
      type: 'low_confidence',
      subject: reply.subject,
      status: 'replied',
      notes: `Confidence: ${confidence} - requires human review`
    });
    return { reply, action: 'human_review', prospect, confidence };
  }

  if (classification === 'POSITIVE') {
    return handlePositiveReply(reply, prospect);
  }

  if (classification === 'NEUTRAL') {
    return handleNeutralReply(reply, prospect);
  }

  return { reply, action: 'unknown', prospect };
}

async function handlePositiveReply(reply, prospect) {
  const replyBody = await generateReply({
    originalEmail: reply.body,
    classification: reply,
    prospect
  });

  await replyToThread({
    threadId: reply.threadId,
    to: prospect.email,
    subject: reply.subject,
    body: replyBody
  });

  await updateProspectStatus(prospect.id, 'replied');
  await logInteraction({
    prospectId: prospect.id,
    type: 'positive_reply',
    subject: reply.subject,
    status: 'replied',
    notes: `Auto-replied with calendly link`
  });

  // Try to schedule a meeting
  try {
    const slots = await getAvailableSlots(2);
    if (slots.length > 0) {
      const meeting = await createMeeting({ prospect, slot: slots[0] });
      await updateProspectStatus(prospect.id, 'meeting');
      await logInteraction({
        prospectId: prospect.id,
        type: 'meeting_scheduled',
        subject: reply.subject,
        status: 'meeting',
        notes: `Meet link: ${meeting.meetLink}`
      });
      return { reply, action: 'meeting_scheduled', prospect, meeting };
    }
  } catch (err) {
    logger.warn('Could not auto-schedule meeting', { error: err.message });
  }

  return { reply, action: 'replied_positive', prospect };
}

async function handleNeutralReply(reply, prospect) {
  const replyBody = await generateReply({
    originalEmail: reply.body,
    classification: reply,
    prospect
  });

  await replyToThread({
    threadId: reply.threadId,
    to: prospect.email,
    subject: reply.subject,
    body: replyBody
  });

  await updateProspectStatus(prospect.id, 'replied');
  await logInteraction({
    prospectId: prospect.id,
    type: 'neutral_reply',
    subject: reply.subject,
    status: 'replied',
    notes: 'Sent clarifying question'
  });

  return { reply, action: 'replied_neutral', prospect };
}

export { handleClassifiedReplies, handleSingleReply };
