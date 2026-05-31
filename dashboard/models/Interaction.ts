import mongoose, { Schema, Document } from 'mongoose';

export interface IInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  prospectId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  type: 'email_sent' | 'reply_received' | 'meeting_scheduled' | 'deal_closed' | 'unsubscribe';
  classification?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNSUBSCRIBE';
  subject: string;
  body: string;
  confidence: number;
  autoReplied: boolean;
  variant?: string;
  stepNumber?: number;
  createdAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    type: {
      type: String,
      enum: ['email_sent', 'reply_received', 'meeting_scheduled', 'deal_closed', 'unsubscribe'],
      required: true,
    },
    classification: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNSUBSCRIBE'],
    },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    autoReplied: { type: Boolean, default: false },
    variant: { type: String },
    stepNumber: { type: Number },
  },
  { timestamps: true }
);

InteractionSchema.index({ userId: 1, createdAt: -1 });
InteractionSchema.index({ prospectId: 1 });

export const Interaction = mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);
