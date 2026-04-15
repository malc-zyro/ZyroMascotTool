import { Grid2x2 } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';

export default function QuantityToggle() {
  const { quantity, setQuantity } = useGeneration();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Grid2x2 className="w-3.5 h-3.5" />
        Quantity
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            onClick={() => setQuantity(n)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              quantity === n
                ? 'bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
