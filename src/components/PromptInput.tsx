import { Wand2, Loader2, AlertCircle } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';

export default function PromptInput() {
  const { prompt, setPrompt, generate, isGenerating, error } = useGeneration();

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      generate();
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your Tanuki scene... (Cmd+Enter to generate)"
          rows={4}
          disabled={isGenerating}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={generate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate
          </>
        )}
      </button>
    </div>
  );
}
