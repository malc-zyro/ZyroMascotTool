import { Settings2 } from 'lucide-react';
import ModelSelector from './ModelSelector';
import ExpressionGrid from './ExpressionGrid';
import PoseSlot from './PoseSlot';
import OutfitSlot from './OutfitSlot';
import ExpressionSlot from './ExpressionSlot';
import ExpressivenessSlider from './ExpressivenessSlider';
import NoBackgroundToggle from './NoBackgroundToggle';
import QuantityToggle from './QuantityToggle';


export default function ControlPanel() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Controls
        </h2>
      </div>

      <div className="space-y-5 bg-slate-850 rounded-2xl border border-slate-700/50 p-4">
        <ModelSelector />
        <div className="h-px bg-slate-700/50" />
        <ExpressionGrid />
        <div className="h-px bg-slate-700/50" />
        <ExpressivenessSlider />
        <div className="h-px bg-slate-700/50" />
        <QuantityToggle />
        <div className="h-px bg-slate-700/50" />
        <NoBackgroundToggle />
        <div className="h-px bg-slate-700/50" />
        <PoseSlot />
        <div className="h-px bg-slate-700/50" />
        <OutfitSlot />
        <div className="h-px bg-slate-700/50" />
        <ExpressionSlot />
      </div>
    </div>
  );
}
