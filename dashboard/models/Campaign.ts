import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignStep {
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
}

export interface ICampaignProspect {
  prospectId: mongoose.Types.ObjectId;
  currentStep: number;
  status: 'pending' | 'sent' | 'replied' | 'bounced' | 'unsubscribed';
  nextSendAt: Date | null;
  lastSentAt: Date | null;
}

export interface ICampaign extends Document {
  userId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  steps: ICampaignStep[];
  prospects: ICampaignProspect[];
  settings: {
    dailyLimit: number;
    sendWindow: { start: number; end: number };
  };
  stats: {
    totalSent: number;
    totalReplies: number;
    totalMeetings: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignStepSchema = new Schema<ICampaignStep>(
  {
    stepNumber: { type: Number, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    delayDays: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignProspectSchema = new Schema<ICampaignProspect>(
  {
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
    currentStep: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'sent', 'replied', 'bounced', 'unsubscribed'],
      default: 'pending',
    },
    nextSendAt: { type: Date, default: null },
    lastSentAt: { type: Date, default: null },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
    },
    steps: [CampaignStepSchema],
    prospects: [CampaignProspectSchema],
    settings: {
      dailyLimit: { type: Number, default: 20 },
      sendWindow: {
        start: { type: Number, default: 9 },
        end: { type: Number, default: 17 },
      },
    },
    stats: {
      totalSent: { type: Number, default: 0 },
      totalReplies: { type: Number, default: 0 },
      totalMeetings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ 'prospects.prospectId': 1 });

export const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
