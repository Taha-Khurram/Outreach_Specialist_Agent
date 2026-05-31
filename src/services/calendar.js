import { google } from 'googleapis';
import config from '../config.js';
import logger from '../utils/logger.js';
import { getAuth } from './gmail.js';

const calendar = google.calendar({ version: 'v3', auth: getAuth() });

async function getAvailableSlots(daysAhead = 2) {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: 'primary' }]
    }
  });

  const busy = response.data.calendars?.primary?.busy || [];
  return findFreeSlots(now, end, busy, config.meeting.duration);
}

function findFreeSlots(start, end, busy, durationMinutes) {
  const slots = [];
  const current = new Date(start);
  current.setMinutes(0, 0, 0);
  current.setHours(current.getHours() + 1);

  while (current < end && slots.length < 5) {
    const day = current.getDay();
    const hour = current.getHours();

    if (day >= 1 && day <= 5 && hour >= 9 && hour <= 17) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
      const conflict = busy.some(b =>
        new Date(b.start) < slotEnd && new Date(b.end) > current
      );

      if (!conflict) {
        slots.push({ start: new Date(current), end: slotEnd });
      }
    }

    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}

async function createMeeting({ prospect, slot }) {
  const event = {
    summary: `Discovery Call - ${prospect.company}`,
    description: `15-min strategy call with ${prospect.name} from ${prospect.company}.\n\nTopics: Web/Mobile development needs, timeline, budget.`,
    start: { dateTime: slot.start.toISOString(), timeZone: 'America/New_York' },
    end: { dateTime: slot.end.toISOString(), timeZone: 'America/New_York' },
    attendees: [{ email: prospect.email }],
    conferenceData: {
      createRequest: {
        requestId: `meeting-${prospect.id}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all'
  });

  logger.info('Meeting created', {
    prospectId: prospect.id,
    eventId: response.data.id,
    meetLink: response.data.hangoutLink
  });

  return {
    eventId: response.data.id,
    meetLink: response.data.hangoutLink || response.data.htmlLink,
    start: slot.start,
    end: slot.end
  };
}

export { getAvailableSlots, createMeeting };
