import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { GeminiModel, Expression, Generation, GenerationResponse } from '../types';

interface GenerationState {
  model: GeminiModel;
  expression: Expression | null;
  poseImageBase64: string | null;
  poseImagePreview: string | null;
  outfitImageBase64: string | null;
  outfitImagePreview: string | null;
  expressionImageBase64: string | null;
  expressionImagePreview: string | null;
  noBackground: boolean;
  sliderLevel: number;
  quantity: number;
  prompt: string;
  isGenerating: boolean;
  error: string | null;
  generations: Generation[];
  selectedGeneration: Generation | null;
  isModalOpen: boolean;
}

interface GenerationContextValue extends GenerationState {
  setModel: (model: GeminiModel) => void;
  setExpression: (expression: Expression | null) => void;
  setPoseImage: (base64: string | null, preview: string | null) => void;
  setOutfitImage: (base64: string | null, preview: string | null) => void;
  setExpressionImage: (base64: string | null, preview: string | null) => void;
  setNoBackground: (value: boolean) => void;
  setSliderLevel: (level: number) => void;
  setQuantity: (qty: number) => void;
  setPrompt: (prompt: string) => void;
  generate: () => Promise<void>;
  loadGenerations: () => Promise<void>;
  toggleStar: (imageId: string) => Promise<void>;
  openComparison: (generation: Generation) => void;
  closeComparison: () => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();

  const [state, setState] = useState<GenerationState>({
    model: 'gemini-3.1-flash-image-preview',
    expression: null,
    poseImageBase64: null,
    poseImagePreview: null,
    outfitImageBase64: null,
    outfitImagePreview: null,
    expressionImageBase64: null,
    expressionImagePreview: null,
    noBackground: false,
    sliderLevel: 2,
    quantity: 1,
    prompt: '',
    isGenerating: false,
    error: null,
    generations: [],
    selectedGeneration: null,
    isModalOpen: false,
  });

  const setModel = useCallback((model: GeminiModel) => {
    setState(s => ({ ...s, model }));
  }, []);

  const setExpression = useCallback((expression: Expression | null) => {
    setState(s => ({ ...s, expression }));
  }, []);

  const setPoseImage = useCallback((base64: string | null, preview: string | null) => {
    setState(s => ({ ...s, poseImageBase64: base64, poseImagePreview: preview }));
  }, []);

  const setOutfitImage = useCallback((base64: string | null, preview: string | null) => {
    setState(s => ({ ...s, outfitImageBase64: base64, outfitImagePreview: preview }));
  }, []);

  const setExpressionImage = useCallback((base64: string | null, preview: string | null) => {
    setState(s => ({ ...s, expressionImageBase64: base64, expressionImagePreview: preview }));
  }, []);

  const setNoBackground = useCallback((noBackground: boolean) => {
    setState(s => ({ ...s, noBackground }));
  }, []);

  const setSliderLevel = useCallback((sliderLevel: number) => {
    setState(s => ({ ...s, sliderLevel }));
  }, []);

  const setQuantity = useCallback((quantity: number) => {
    setState(s => ({ ...s, quantity }));
  }, []);

  const setPrompt = useCallback((prompt: string) => {
    setState(s => ({ ...s, prompt }));
  }, []);

  const openComparison = useCallback((generation: Generation) => {
    setState(s => ({ ...s, selectedGeneration: generation, isModalOpen: true }));
  }, []);

  const closeComparison = useCallback(() => {
    setState(s => ({ ...s, selectedGeneration: null, isModalOpen: false }));
  }, []);

  const loadGenerations = useCallback(async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from('generations')
      .select('*, generated_images(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setState(s => ({ ...s, generations: data as Generation[] }));
    }
  }, [session]);

  const toggleStar = useCallback(async (imageId: string) => {
    const gen = state.generations.find(g =>
      g.generated_images.some(img => img.id === imageId)
    );
    const image = gen?.generated_images.find(img => img.id === imageId);
    if (!image) return;

    const newStarred = !image.starred;

    setState(s => ({
      ...s,
      generations: s.generations.map(g => ({
        ...g,
        generated_images: g.generated_images.map(img =>
          img.id === imageId ? { ...img, starred: newStarred } : img
        ),
      })),
      selectedGeneration: s.selectedGeneration ? {
        ...s.selectedGeneration,
        generated_images: s.selectedGeneration.generated_images.map(img =>
          img.id === imageId ? { ...img, starred: newStarred } : img
        ),
      } : null,
    }));

    const { error } = await supabase
      .from('generated_images')
      .update({ starred: newStarred })
      .eq('id', imageId);

    if (error) {
      setState(s => ({
        ...s,
        generations: s.generations.map(g => ({
          ...g,
          generated_images: g.generated_images.map(img =>
            img.id === imageId ? { ...img, starred: !newStarred } : img
          ),
        })),
      }));
    }
  }, [state.generations]);

  const generate = useCallback(async () => {
    if (!state.prompt.trim()) {
      setState(s => ({ ...s, error: 'Please enter a prompt.' }));
      return;
    }

    setState(s => ({ ...s, isGenerating: true, error: null }));

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('You must be signed in to generate images.');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tanuki-generate`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: state.prompt,
          model: state.model,
          expression: state.expression,
          pose_image_base64: state.poseImageBase64,
          outfit_image_base64: state.outfitImageBase64,
          expression_image_base64: state.expressionImageBase64,
          slider_level: state.sliderLevel,
          quantity: state.quantity,
          no_background: state.noBackground,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      const genResponse = data as GenerationResponse;

      const newGeneration: Generation = {
        id: genResponse.generation_id,
        user_id: user?.id ?? '',
        original_prompt: genResponse.original_prompt,
        enhanced_prompt: genResponse.enhanced_prompt,
        model: state.model,
        expression: state.expression,
        slider_level: state.sliderLevel,
        quantity: state.quantity,
        created_at: new Date().toISOString(),
        generated_images: genResponse.images.map(img => ({
          id: img.id,
          generation_id: genResponse.generation_id,
          storage_path: '',
          image_url: img.url,
          starred: false,
          created_at: new Date().toISOString(),
        })),
      };

      setState(s => ({
        ...s,
        isGenerating: false,
        generations: [newGeneration, ...s.generations],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState(s => ({ ...s, isGenerating: false, error: message }));
    }
  }, [state.prompt, state.model, state.expression, state.poseImageBase64, state.outfitImageBase64, state.expressionImageBase64, state.sliderLevel, state.quantity, state.noBackground]);

  useEffect(() => {
    loadGenerations();
  }, [loadGenerations]);

  return (
    <GenerationContext.Provider
      value={{
        ...state,
        setModel,
        setExpression,
        setPoseImage,
        setOutfitImage,
        setExpressionImage,
        setNoBackground,
        setSliderLevel,
        setQuantity,
        setPrompt,
        generate,
        loadGenerations,
        toggleStar,
        openComparison,
        closeComparison,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider');
  return ctx;
}
