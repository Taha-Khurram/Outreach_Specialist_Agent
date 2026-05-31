import mongoose, { Schema, Document } from 'mongoose';

export interface IProspect extends Document {
  userId: mongoose.Types.ObjectId;
  apolloId: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  techStack: string[];
  funding: string;
  fundingAmount: number | null;
  companySize: number | null;
  linkedinUrl: string;
  status: 'new' | 'contacted' | 'replied' | 'meeting' | 'closed' | 'unsubscribed' | 'bounced';
  lastContactedAt: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProspectSchema = new Schema<IProspect>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    apolloId: { type: String, default: '' },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    email: { type: String, required: true },
    title: { type: String, default: '' },
    company: { type: String, required: true },
    industry: { type: String, default: '' },
    techStack: [{ type: String }],
    funding: { type: String, default: '' },
    fundingAmount: { type: Number, default: null },
    companySize: { type: Number, default: null },
    linkedinUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'replied', 'meeting', 'closed', 'unsubscribed', 'bounced'],
      default: 'new',
    },
    lastContactedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ProspectSchema.index({ userId: 1, status: 1 });
ProspectSchema.index({ userId: 1, email: 1 }, { unique: true });

export const Prospect = mongoose.models.Prospect || mongoose.model<IProspect>('Prospect', ProspectSchema);
