export enum Tone {
  PROFESSIONAL = 'Professional',
  WITTY = 'Witty',
  URGENT = 'Urgent',
  CASUAL = 'Casual',
  INSPIRATIONAL = 'Inspirational'
}

export enum Platform {
  LINKEDIN = 'LinkedIn',
  TWITTER = 'Twitter/X',
  INSTAGRAM = 'Instagram'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface GeneratedPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  imagePrompt: string;
  imageUrl?: string; // Data URL
  aspectRatio: AspectRatio;
}

export interface CampaignData {
  linkedin: GeneratedPost;
  twitter: GeneratedPost;
  instagram: GeneratedPost;
}

export interface VeoState {
  isGenerating: boolean;
  videoUrl: string | null;
  error: string | null;
  progressMessage: string;
}
