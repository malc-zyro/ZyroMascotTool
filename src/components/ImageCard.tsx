import { Eye, Star } from 'lucide-react';
import type { Generation, GeneratedImage } from '../types';
import { useGeneration } from '../context/GenerationContext';

interface ImageCardProps {
  image: GeneratedImage;
  generation: Generation;
  onOpenComparison: (generation: Generation) => void;
}

export default function ImageCard({ image, generation, onOpenComparison }: ImageCardProps) {
  const { toggleStar } = useGeneration();

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(image.id);
  };

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer"
      onClick={() => onOpenComparison(generation)}
    >
      <div className="aspect-square">
        <img
          src={image.image_url}
          alt={generation.original_prompt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <button
        onClick={handleStarClick}
        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 z-10 ${
          image.starred
            ? 'bg-amber-500/20 text-amber-400 opacity-100'
            : 'bg-slate-900/60 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-400'
        }`}
      >
        <Star className={`w-4 h-4 ${image.starred ? 'fill-amber-400' : ''}`} />
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <p className="text-xs text-slate-300 line-clamp-2 mb-2">
          {generation.original_prompt}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {generation.expression && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                {generation.expression}
              </span>
            )}
            {generation.slider_level > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                Lv.{generation.slider_level}
              </span>
            )}
          </div>
          <Eye className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
