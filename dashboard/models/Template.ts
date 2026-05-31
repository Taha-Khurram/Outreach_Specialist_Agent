import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplateStep {
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
}

export interface ITemplate extends Document {
  userId: string;
  name: string;
  description: string;
  category: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'case_study';
  steps: ITemplateStep[];
  isDefault: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateStepSchema = new Schema({
  stepNumber: { type: Number, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  delayDays: { type: Number, default: 3 },
}, { _id: false });

const TemplateSchema = new Schema<ITemplate>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['cold_outreach', 'follow_up', 'meeting_request', 'case_study'],
      default: 'cold_outreach',
    },
    steps: [TemplateStepSchema],
    isDefault: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1 });
TemplateSchema.index({ isDefault: 1 });

export const Template = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
