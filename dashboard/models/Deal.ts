import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  userId: string;
  prospectId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  value: number;
  currency: string;
  status: 'won' | 'lost' | 'negotiating';
  closeDate: Date;
  notes: string;
  services: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    userId: { type: String, required: true },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['won', 'lost', 'negotiating'], default: 'won' },
    closeDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    services: [{ type: String }],
  },
  { timestamps: true }
);

DealSchema.index({ userId: 1, status: 1 });
DealSchema.index({ prospectId: 1 });

export const Deal = mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);
