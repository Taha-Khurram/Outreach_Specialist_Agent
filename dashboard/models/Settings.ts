import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  apiKeys: {
    apolloApiKey: string;
    geminiApiKey: string;
    googleRefreshToken: string;
  };
  email: {
    senderEmail: string;
    senderName: string;
    dailySendLimit: number;
    calendlyLink: string;
  };
  ai: {
    model: string;
    confidenceThreshold: number;
    autoReplyPositive: boolean;
    autoUnsubscribe: boolean;
  };
  targeting: {
    titles: string[];
    industries: string[];
    companySize: string;
    location: string;
  };
  schedule: {
    discoveryTime: string;
    emailSendTime: string;
    replyCheckInterval: number;
    reportTime: string;
  };
  goals: {
    monthlyDealTarget: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    apiKeys: {
      apolloApiKey: { type: String, default: '' },
      geminiApiKey: { type: String, default: '' },
      googleRefreshToken: { type: String, default: '' },
    },
    email: {
      senderEmail: { type: String, default: '' },
      senderName: { type: String, default: '' },
      dailySendLimit: { type: Number, default: 50 },
      calendlyLink: { type: String, default: '' },
    },
    ai: {
      model: { type: String, default: 'gemini-3-flash-preview' },
      confidenceThreshold: { type: Number, default: 0.8 },
      autoReplyPositive: { type: Boolean, default: true },
      autoUnsubscribe: { type: Boolean, default: true },
    },
    targeting: {
      titles: { type: [String], default: ['CEO', 'CTO', 'VP Engineering', 'Founder'] },
      industries: { type: [String], default: ['SaaS', 'E-commerce', 'FinTech', 'HealthTech'] },
      companySize: { type: String, default: '10-200 employees' },
      location: { type: String, default: 'United States' },
    },
    schedule: {
      discoveryTime: { type: String, default: '09:00' },
      emailSendTime: { type: String, default: '10:00' },
      replyCheckInterval: { type: Number, default: 5 },
      reportTime: { type: String, default: '18:00' },
    },
    goals: {
      monthlyDealTarget: { type: Number, default: 2 },
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
