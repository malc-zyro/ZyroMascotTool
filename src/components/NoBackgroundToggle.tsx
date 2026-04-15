import { ImageOff } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';

export default function NoBackgroundToggle() {
  const { noBackground, setNoBackground } = useGeneration();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <ImageOff className="w-3.5 h-3.5" />
        Background
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => setNoBackground(false)}
          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all duration-200 ${
            !noBackground
              ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
          }`}
        >
          <span className={`block text-sm font-medium ${
            !noBackground ? 'text-cyan-300' : 'text-slate-400'
          }`}>
            Scene
          </span>
          <span className={`block text-[10px] mt-0.5 ${
            !noBackground ? 'text-cyan-400/60' : 'text-slate-500'
          }`}>
            With environment
          </span>
        </button>
        <button
          onClick={() => setNoBackground(true)}
          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all duration-200 ${
            noBackground
              ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
          }`}
        >
          <span className={`block text-sm font-medium ${
            noBackground ? 'text-cyan-300' : 'text-slate-400'
          }`}>
            No Background
          </span>
          <span className={`block text-[10px] mt-0.5 ${
            noBackground ? 'text-cyan-400/60' : 'text-slate-500'
          }`}>
            White cutout
          </span>
        </button>
      </div>
    </div>
  );
}
