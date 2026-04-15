import { ImagePlus, X } from 'lucide-react';
import { useCallback, useRef } from 'react';

interface ImageSlotProps {
  label: string;
  icon?: React.ReactNode;
  preview: string | null;
  onImageChange: (base64: string | null, preview: string | null) => void;
  altText: string;
}

export default function ImageSlot({ label, icon, preview, onImageChange, altText }: ImageSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onImageChange(base64, result);
    };
    reader.readAsDataURL(file);
  }, [onImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        {icon || <ImagePlus className="w-3.5 h-3.5" />}
        {label}
        <span className="text-slate-600 font-normal normal-case tracking-normal">(optional)</span>
      </label>

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt={altText}
            className="w-full h-32 object-contain rounded-lg bg-slate-800 border border-slate-700"
          />
          <button
            onClick={() => onImageChange(null, null)}
            className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded-md text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800 transition-colors"
        >
          <ImagePlus className="w-6 h-6 text-slate-600 mb-2" />
          <span className="text-xs text-slate-500">Drop image or click</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
