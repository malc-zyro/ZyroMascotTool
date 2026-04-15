import { SmilePlus } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import ImageSlot from './ImageSlot';

export default function ExpressionSlot() {
  const { expressionImagePreview, setExpressionImage } = useGeneration();

  return (
    <ImageSlot
      label="Expression Guide"
      icon={<SmilePlus className="w-3.5 h-3.5" />}
      preview={expressionImagePreview}
      onImageChange={setExpressionImage}
      altText="Expression guide"
    />
  );
}
