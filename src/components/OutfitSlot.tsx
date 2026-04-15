import { Shirt } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import ImageSlot from './ImageSlot';

export default function OutfitSlot() {
  const { outfitImagePreview, setOutfitImage } = useGeneration();

  return (
    <ImageSlot
      label="Outfit Guide"
      icon={<Shirt className="w-3.5 h-3.5" />}
      preview={outfitImagePreview}
      onImageChange={setOutfitImage}
      altText="Outfit guide"
    />
  );
}
