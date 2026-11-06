import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { User } from "@supabase/supabase-js";
import { SimulationProvider } from "./components/SimulationProvider";
import { Dashboard } from "./components/Dashboard";
import { Loader2, Zap, LogIn, AlertCircle, ExternalLink } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>({ 
    id: "dev-mock-id", 
    email: "dev@example.com", 
    user_metadata: { full_name: "Developer Mode" } 
  } as any);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Auth bypassed for frontend-only development
    /*
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error("Session error:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) setAuthError(null);
    });

    return () => subscription.unsubscribe();
    */
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login Error:", error);
      setAuthError(error.message || "An authentication error occurred.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-natural-bg">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-natural-primary" />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest opacity-40 italic">Syncing with CropPulse Cloud</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-natural-bg border-8 border-natural-border-muted overflow-hidden">
        <div className="max-w-md w-full p-12 bg-white rounded-[40px] border border-natural-border shadow-xl text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-natural-primary rounded-2xl flex items-center justify-center shadow-lg">
             <Zap size={24} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-serif italic text-natural-primary mb-2 mt-4">CropPulse</h1>
          <p className="text-xs uppercase tracking-[0.3em] font-bold opacity-40 mb-8">AI Soil Intelligence</p>
          
          <div className="space-y-6 text-sm text-natural-text opacity-70 mb-10 leading-relaxed italic font-serif">
            <p>"The future of agriculture lies in the digital root zone."</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-natural-dark text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-opacity-90 transition-all shadow-md group"
            >
              <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
              Initialize Terminal
            </button>

            {authError && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-left">
                <AlertCircle size={14} className="text-orange-600 mt-1 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-orange-900 uppercase tracking-tight">{authError}</p>
                  <a 
                    href={window.location.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-[10px] font-bold text-natural-accent flex items-center gap-1 hover:underline"
                  >
                    Open in New Tab <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <p className="mt-8 text-[9px] font-mono opacity-30 uppercase tracking-[0.1em]">Secure Multi-User Access Protocol v1.0.4</p>
        </div>
      </div>
    );
  }

  return (
    <SimulationProvider user={user}>
      <div className="min-h-screen bg-natural-bg text-natural-text selection:bg-natural-dark selection:text-natural-bg">
        <Dashboard onLogout={handleLogout} user={user} />
      </div>
    </SimulationProvider>
  );
}

