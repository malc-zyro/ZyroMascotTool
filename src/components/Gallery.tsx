import { ImageOff } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import ImageCard from './ImageCard';

export default function Gallery() {
  const { generations, openComparison } = useGeneration();

  const allImages = generations.flatMap(gen =>
    gen.generated_images.map(img => ({ image: img, generation: gen }))
  );

  if (allImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600">
        <ImageOff className="w-12 h-12 mb-3" />
        <p className="text-sm">No images generated yet</p>
        <p className="text-xs mt-1">Write a prompt and hit Generate to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Gallery
        </h2>
        <span className="text-xs text-slate-600">
          {allImages.length} image{allImages.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {allImages.map(({ image, generation }) => (
          <ImageCard
            key={image.id}
            image={image}
            generation={generation}
            onOpenComparison={openComparison}
          />
        ))}
      </div>
    </div>
  );
}
