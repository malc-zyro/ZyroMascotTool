import { Smile } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import { EXPRESSIONS, type Expression } from '../types';

const EXPRESSION_ICONS: Record<Expression, string> = {
  sad: '😢',
  angry: '😠',
  joy: '😄',
  surprise: '😲',
  fear: '😨',
  disgust: '🤢',
  neutral: '😐',
  love: '🥰',
  thinking: '🤔',
  determined: '😤',
  shy: '😊',
};

export default function ExpressionGrid() {
  const { expression, setExpression } = useGeneration();

  function toggle(expr: Expression) {
    setExpression(expression === expr ? null : expr);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Smile className="w-3.5 h-3.5" />
        Expression
      </label>
      <div className="grid grid-cols-4 gap-2">
        {EXPRESSIONS.map(expr => {
          const active = expression === expr;
          return (
            <button
              key={expr}
              onClick={() => toggle(expr)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                active
                  ? 'bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <span className="text-lg leading-none">{EXPRESSION_ICONS[expr]}</span>
              <span className="capitalize">{expr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
