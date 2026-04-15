import { AuthProvider, useAuth } from './context/AuthContext';
import { GenerationProvider } from './context/GenerationContext';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import PromptInput from './components/PromptInput';
import Gallery from './components/Gallery';
import ComparisonModal from './components/ComparisonModal';
import LoginScreen from './components/LoginScreen';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <GenerationProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
                <ControlPanel />
              </div>
            </aside>

            <section className="lg:col-span-8 xl:col-span-9 space-y-6">
              <PromptInput />
              <Gallery />
            </section>
          </div>
        </main>

        <ComparisonModal />
      </div>
    </GenerationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
