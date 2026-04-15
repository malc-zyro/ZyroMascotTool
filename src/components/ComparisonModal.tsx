import { X, ArrowRight, Cpu, Gauge, Smile, Star, Download, ChevronDown } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useGeneration } from '../context/GenerationContext';

type FileType = 'png' | 'jpg';
type Resolution = '512' | '1024' | '2048';

const RESOLUTION_LABELS: Record<Resolution, string> = {
  '512': '512',
  '1024': '1K',
  '2048': '2K',
};

async function downloadImage(
  url: string,
  width: number,
  height: number,
  fileType: FileType,
  fileName: string
) {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const img = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
  });
  img.crossOrigin = 'anonymous';
  img.src = URL.createObjectURL(blob);
  await loaded;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const mime = fileType === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = fileType === 'jpg' ? 0.92 : undefined;

  const outBlob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, mime, quality)
  );
  if (!outBlob) return;

  const objUrl = URL.createObjectURL(outBlob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objUrl);
}

export default function ComparisonModal() {
  const { selectedGeneration, isModalOpen, closeComparison, toggleStar } = useGeneration();
  const [fileType, setFileType] = useState<FileType>('png');
  const [resolution, setResolution] = useState<Resolution>('1024');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeComparison();
    }
    if (isModalOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeComparison]);

  const handleDownloadAll = useCallback(async () => {
    if (!selectedGeneration || downloading) return;
    setDownloading(true);
    const dim = parseInt(resolution);
    const ts = Math.floor(Date.now() / 1000);
    try {
      for (let i = 0; i < selectedGeneration.generated_images.length; i++) {
        const img = selectedGeneration.generated_images[i];
        const name = `tanuki-${ts}-${i + 1}.${fileType}`;
        await downloadImage(img.image_url, dim, dim, fileType, name);
      }
    } finally {
      setDownloading(false);
    }
  }, [selectedGeneration, downloading, resolution, fileType]);

  if (!isModalOpen || !selectedGeneration) return null;

  const gen = selectedGeneration;
  const hasEnhancement = gen.enhanced_prompt && gen.enhanced_prompt !== gen.original_prompt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeComparison}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Generation Details
          </h3>
          <button
            onClick={closeComparison}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gen.generated_images.map(img => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50">
                <img
                  src={img.image_url}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
                <button
                  onClick={() => toggleStar(img.id)}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 ${
                    img.starred
                      ? 'bg-amber-500/20 text-amber-400 opacity-100'
                      : 'bg-slate-900/60 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                  }`}
                >
                  <Star className={`w-4 h-4 ${img.starred ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <select
                value={fileType}
                onChange={e => setFileType(e.target.value as FileType)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium cursor-pointer hover:border-slate-600 transition-colors focus:outline-none focus:border-slate-500"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={resolution}
                onChange={e => setResolution(e.target.value as Resolution)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium cursor-pointer hover:border-slate-600 transition-colors focus:outline-none focus:border-slate-500"
              >
                <option value="512">512</option>
                <option value="1024">1K</option>
                <option value="2048">2K</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium hover:border-slate-600 hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-pulse' : ''}`} />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
          </div>

          {hasEnhancement ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-medium uppercase tracking-wider">
                    Original Prompt
                  </span>
                </div>
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {gen.original_prompt}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium uppercase tracking-wider">
                    AI-Enhanced Prompt
                  </span>
                  <ArrowRight className="w-3 h-3 text-cyan-500" />
                </div>
                <div className="p-4 bg-slate-800 border border-cyan-500/20 rounded-xl">
                  <p className="text-sm text-cyan-200/80 leading-relaxed">
                    {gen.enhanced_prompt}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-medium uppercase tracking-wider">
                Prompt (No Enhancement)
              </span>
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {gen.original_prompt}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
              <Cpu className="w-3 h-3" />
              {gen.model}
            </div>
            {gen.expression && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
                <Smile className="w-3 h-3" />
                {gen.expression}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
              <Gauge className="w-3 h-3" />
              Level {gen.slider_level}
            </div>
            <div className="text-xs text-slate-600 self-center ml-auto">
              {new Date(gen.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
