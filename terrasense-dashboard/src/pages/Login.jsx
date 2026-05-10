import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { LogIn, Loader2, AlertCircle, Leaf, User, Mail, Phone, Lock, Globe, Moon, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export default function Login() {
  const navigate = useNavigate()
  const { session } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLogin, setIsLogin] = useState(false) // Toggle between Login and Signup

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#FAF7F2] font-sans selection:bg-[#2D6A4F] selection:text-white">
      
      {/* Left Panel: High-Fidelity Agriculture Visualization */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src="/login_bg.png" 
          alt="Agricultural Intelligence" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/90 via-[#1B4332]/20 to-transparent" />
        
        <div className="absolute top-12 left-12">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <Leaf className="text-[#95D5B2]" size={24} />
             </div>
                <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>CropPulse Access</h1>
          </div>
        </div>

        <div className="absolute bottom-24 left-12 right-12">
          <h2 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
            Capture the <br /> <span className="italic text-[#95D5B2]">soul</span> of soil.
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-lg font-medium leading-relaxed">
            Neural-link monitoring for the premium CropPulse cultivator. Identify stress before it's visible.
          </p>
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
                <Leaf className="text-[#95D5B2]" size={16} />
                <span className="text-white text-xs font-bold uppercase tracking-widest">Organic AI</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
                <Globe className="text-[#95D5B2]" size={16} />
                <span className="text-white text-xs font-bold uppercase tracking-widest">Precision Data</span>
             </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-12 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
           © 2024 CropPulse AI. Cultivating the future.
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 relative">
        
        {/* Top Actions */}
        <div className="absolute top-12 right-12 flex items-center gap-6">
           <button className="text-gray-400 hover:text-[#2D6A4F] transition-colors"><Globe size={20} /></button>
           <button className="text-gray-400 hover:text-[#2D6A4F] transition-colors"><Moon size={20} /></button>
        </div>

        <div className="w-full max-w-md">
          {/* Card Wrapper */}
          <div className="bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl shadow-black/5 border border-gray-100 relative overflow-hidden">
            
            {/* Logo Mobile */}
            <div className="lg:hidden flex justify-center mb-10">
               <div className="p-3 bg-[#1B4332] rounded-2xl">
                  <Leaf className="text-white" size={32} />
               </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Welcome to CropPulse</h2>
              <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                {isLogin ? 'Welcome Back' : 'Create Your Account'}
              </h1>
              <p className="text-sm text-gray-400 font-medium">
                {isLogin ? 'Continue your journey into smart agriculture.' : 'Start your journey into smart agriculture.'}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2D6A4F] transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Johnathan Doe" 
                      className="w-full pl-14 pr-6 py-5 bg-[#FAF7F2] border-2 border-transparent rounded-2xl focus:border-[#2D6A4F] focus:bg-white transition-all outline-none text-sm font-bold placeholder:text-gray-300"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2D6A4F] transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="hello@CropPulse.ai" 
                    className="w-full pl-14 pr-6 py-5 bg-[#FAF7F2] border-2 border-transparent rounded-2xl focus:border-[#2D6A4F] focus:bg-white transition-all outline-none text-sm font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2D6A4F] transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="+1 (555) 000" 
                        className="w-full pl-12 pr-4 py-5 bg-[#FAF7F2] border-2 border-transparent rounded-2xl focus:border-[#2D6A4F] focus:bg-white transition-all outline-none text-xs font-bold placeholder:text-gray-300"
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2D6A4F] transition-colors" size={16} />
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full pl-12 pr-4 py-5 bg-[#FAF7F2] border-2 border-transparent rounded-2xl focus:border-[#2D6A4F] focus:bg-white transition-all outline-none text-xs font-bold placeholder:text-gray-300"
                      />
                    </div>
                 </div>
              </div>

              {session ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#D8F3DC]/30 border border-[#D8F3DC] rounded-2xl">
                    <p className="text-xs text-[#2D6A4F] font-bold text-center">
                      You are already logged in as <br />
                      <span className="text-sm font-black">{session.user.email}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-[#1B4332] text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
                  >
                    <LayoutDashboard size={18} />
                    CONTINUE TO DASHBOARD
                  </button>
                  <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <span className="relative px-6 bg-white text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Or switch account</span>
                  </div>
                </div>
              ) : (
                <button className="w-full bg-[#1B4332] text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-900/20 mt-4">
                   {isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
                </button>
              )}

              <div className="relative flex items-center justify-center my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <span className="relative px-6 bg-white text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Or continue with</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={handleGoogleLogin}
                   disabled={loading}
                   className="flex items-center justify-center gap-3 py-4 border-2 border-[#FAF7F2] rounded-2xl hover:bg-gray-50 transition-all font-bold text-xs"
                 >
                   {loading ? <Loader2 className="animate-spin" size={16} /> : (
                     <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                           <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                           <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                           <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                           <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                     </>
                   )}
                 </button>
                 <button className="flex items-center justify-center gap-3 py-4 border-2 border-[#FAF7F2] rounded-2xl hover:bg-gray-50 transition-all font-bold text-xs">
                    <Phone size={16} />
                    Phone OTP
                 </button>
              </div>

              <div className="text-center mt-10">
                 <p className="text-xs text-gray-400 font-medium">
                   {isLogin ? "Don't have an account? " : "Already have an account? "}
                   <button 
                     onClick={() => setIsLogin(!isLogin)}
                     className="text-[#2D6A4F] font-black hover:underline underline-offset-4 ml-1"
                   >
                     {isLogin ? 'Sign up' : 'Login'}
                   </button>
                 </p>
              </div>
            </div>
          </div>
          
          {/* Footer Mobile */}
          <div className="mt-12 flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-widest px-4">
             <span>Privacy Policy</span>
             <span>Terms of Service</span>
             <span>Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}
