import { ChevronDown, Cpu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useGeneration } from '../context/GenerationContext';
import { MODEL_OPTIONS, type GeminiModel } from '../types';

export default function ModelSelector() {
  const { model, setModel } = useGeneration();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = MODEL_OPTIONS.find(m => m.value === model)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Cpu className="w-3.5 h-3.5" />
        Model
      </label>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>{selected.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-medium">
              {selected.tag}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 overflow-hidden z-20">
            {MODEL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setModel(opt.value as GeminiModel);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                  opt.value === model
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">
                  {opt.tag}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
