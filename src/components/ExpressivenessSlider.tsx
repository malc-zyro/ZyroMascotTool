import { Gauge } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';

const LEVELS = [
  { value: 1, label: 'Literal', description: 'Raw prompt' },
  { value: 2, label: 'Enhanced', description: 'Default' },
  { value: 3, label: 'Dynamic', description: 'Max drama' },
];

export default function ExpressivenessSlider() {
  const { sliderLevel, setSliderLevel } = useGeneration();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Gauge className="w-3.5 h-3.5" />
        Expressiveness
      </label>
      <div className="flex gap-2">
        {LEVELS.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => setSliderLevel(value)}
            className={`flex-1 py-2 px-1 rounded-lg text-center transition-all duration-200 ${
              sliderLevel === value
                ? 'bg-cyan-500/15 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <span className={`block text-sm font-medium ${
              sliderLevel === value ? 'text-cyan-300' : 'text-slate-400'
            }`}>
              {label}
            </span>
            <span className={`block text-[10px] mt-0.5 ${
              sliderLevel === value ? 'text-cyan-400/60' : 'text-slate-500'
            }`}>
              {description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
