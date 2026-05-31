import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalSent: number;
  totalReplies: number;
  totalMeetings: number;
  prospects: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
    },
    totalSent: { type: Number, default: 0 },
    totalReplies: { type: Number, default: 0 },
    totalMeetings: { type: Number, default: 0 },
    prospects: [{ type: Schema.Types.ObjectId, ref: 'Prospect' }],
  },
  { timestamps: true }
);

export const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
