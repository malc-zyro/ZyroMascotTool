import { Move } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import ImageSlot from './ImageSlot';

export default function PoseSlot() {
  const { poseImagePreview, setPoseImage } = useGeneration();

  return (
    <ImageSlot
      label="Pose Guide"
      icon={<Move className="w-3.5 h-3.5" />}
      preview={poseImagePreview}
      onImageChange={setPoseImage}
      altText="Pose guide"
    />
  );
}
