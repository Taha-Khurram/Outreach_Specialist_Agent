import { IProspect, IScoreBreakdown, IResearch } from '@/models/Prospect';
import { ICampaign, ICampaignStep, ICampaignProspect } from '@/models/Campaign';
import { ISettings } from '@/models/Settings';

export type LeanProspect = Omit<IProspect, keyof Document> & { _id: string };
export type LeanSettings = Omit<ISettings, keyof Document> & { _id: string };
export type LeanCampaign = Omit<ICampaign, keyof Document> & { _id: string };

export type { IScoreBreakdown, IResearch, ICampaignStep, ICampaignProspect };
