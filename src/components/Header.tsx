import { Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">
                TANUKI <span className="text-cyan-400">MASTER RIG</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 -mt-0.5">
                Image Generation Studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden sm:block text-xs text-slate-500 truncate max-w-[180px]">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
