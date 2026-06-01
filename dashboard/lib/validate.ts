import { z } from 'zod';
import { NextResponse } from 'next/server';

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

const sanitizedString = z.string().transform((s) => s.replace(/<[^>]*>/g, ''));

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const signupSchema = z.object({
  name: sanitizedString.pipe(z.string().min(1, 'Name is required').max(100)),
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  company: sanitizedString.pipe(z.string().max(200)).optional().default(''),
});

const coercePositiveInt = (min: number, max: number, fallback: number) =>
  z.union([z.number(), z.nan()]).transform(v => (Number.isFinite(v) && v >= min ? Math.min(Math.round(v), max) : fallback));

export const settingsSchema = z.object({
  email: z.object({
    senderEmail: z.string().email().or(z.literal('')).optional(),
    senderName: sanitizedString.pipe(z.string().max(100)).optional(),
    dailySendLimit: coercePositiveInt(1, 500, 50).optional(),
    calendlyLink: z.string().url().or(z.literal('')).optional(),
  }).partial().optional(),
  ai: z.object({
    model: z.string().max(50).optional(),
    confidenceThreshold: z.union([z.number(), z.nan()]).transform(v => Number.isFinite(v) ? Math.max(0.5, Math.min(v, 1)) : 0.8).optional(),
    autoReplyPositive: z.boolean().optional(),
    autoUnsubscribe: z.boolean().optional(),
  }).partial().optional(),
  targeting: z.object({
    titles: z.array(sanitizedString.pipe(z.string().max(100))).max(50).optional(),
    industries: z.array(sanitizedString.pipe(z.string().max(100))).max(50).optional(),
    companySize: sanitizedString.pipe(z.string().max(50)).optional(),
    location: sanitizedString.pipe(z.string().max(100)).optional(),
  }).partial().optional(),
  schedule: z.object({
    discoveryTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    emailSendTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    replyCheckInterval: coercePositiveInt(1, 60, 5).optional(),
    reportTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }).partial().optional(),
  goals: z.object({
    monthlyDealTarget: coercePositiveInt(1, 100, 2).optional(),
  }).partial().optional(),
});

export const prospectSchema = z.object({
  name: sanitizedString.pipe(z.string().min(1).max(200)),
  email: z.string().email().max(255),
  company: sanitizedString.pipe(z.string().max(200)).optional().default(''),
  title: sanitizedString.pipe(z.string().max(200)).optional().default(''),
  industry: sanitizedString.pipe(z.string().max(100)).optional().default(''),
  companySize: sanitizedString.pipe(z.string().max(50)).optional().default(''),
  location: sanitizedString.pipe(z.string().max(100)).optional().default(''),
  linkedinUrl: z.string().url().or(z.literal('')).optional().default(''),
  phone: z.string().max(30).optional().default(''),
  notes: sanitizedString.pipe(z.string().max(5000)).optional().default(''),
  status: z.enum(['new', 'researched', 'contacted', 'replied', 'meeting_scheduled', 'closed', 'unsubscribed']).optional(),
});

export const campaignSchema = z.object({
  name: sanitizedString.pipe(z.string().min(1, 'Campaign name is required').max(200)),
  steps: z.array(z.object({
    stepNumber: z.number().int().min(1).optional(),
    subject: sanitizedString.pipe(z.string().min(1).max(500)),
    body: z.string().min(1).max(10000),
    delayDays: z.number().int().min(0).max(90).optional().default(3),
  })).optional().default([]),
  settings: z.object({
    dailyLimit: z.number().int().min(1).max(500).optional().default(20),
    sendWindow: z.object({
      start: z.number().int().min(0).max(23).optional().default(9),
      end: z.number().int().min(0).max(23).optional().default(17),
    }).optional(),
  }).optional(),
  prospectIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional().default([]),
});

export const dealSchema = z.object({
  prospectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid prospect ID'),
  value: z.number().min(0, 'Deal value cannot be negative'),
  status: z.enum(['won', 'lost', 'pending']).optional().default('won'),
  notes: sanitizedString.pipe(z.string().max(5000)).optional().default(''),
  services: z.array(sanitizedString.pipe(z.string().max(200))).max(20).optional().default([]),
  campaignId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const templateSchema = z.object({
  name: sanitizedString.pipe(z.string().min(1, 'Template name is required').max(200)),
  description: sanitizedString.pipe(z.string().max(500)).optional().default(''),
  category: z.enum(['cold_outreach', 'follow_up', 'case_study', 'breakup']).optional().default('cold_outreach'),
  steps: z.array(z.object({
    subject: sanitizedString.pipe(z.string().min(1).max(500)),
    body: z.string().min(1).max(10000),
    delayDays: z.number().int().min(0).max(90).optional().default(3),
  })).min(1, 'At least one step is required'),
});
