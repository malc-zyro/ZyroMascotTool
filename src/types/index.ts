export type GeminiModel =
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-2.5-flash-image';

export type Expression =
  | 'sad'
  | 'angry'
  | 'joy'
  | 'surprise'
  | 'fear'
  | 'disgust'
  | 'neutral'
  | 'love'
  | 'thinking'
  | 'determined'
  | 'shy';

export const EXPRESSIONS: Expression[] = [
  'sad',
  'angry',
  'joy',
  'surprise',
  'fear',
  'disgust',
  'neutral',
  'love',
  'thinking',
  'determined',
  'shy',
];

export const MODEL_OPTIONS: { value: GeminiModel; label: string; tag: string }[] = [
  { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image', tag: 'Speed' },
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', tag: 'Stability' },
];

export interface GeneratedImage {
  id: string;
  generation_id: string;
  storage_path: string;
  image_url: string;
  starred: boolean;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  original_prompt: string;
  enhanced_prompt: string | null;
  model: string;
  expression: string | null;
  slider_level: number;
  quantity: number;
  created_at: string;
  generated_images: GeneratedImage[];
}

export interface GenerationResponse {
  generation_id: string;
  images: { id: string; url: string }[];
  original_prompt: string;
  enhanced_prompt: string | null;
}
