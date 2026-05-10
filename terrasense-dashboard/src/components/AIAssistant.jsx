import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, X, Mic, Languages, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useMQTT } from '../contexts/MQTTContext'

export default function AIAssistant() {
  const { processNLPCommand, isAILoading, t } = useLanguage()
  const { sensorData } = useMQTT()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ai', text: t('ai_greeting') || 'Namaste! I am CropPulse, your CropPulse AI. How can I help you manage your farm today?' }
  ])
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async () => {
    if (!query.trim()) return
    
    const userMsg = { role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')

    // Process via NLP Engine in Context (Passing sensorData for Data Awareness)
    const result = await processNLPCommand(query, sensorData)
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: result.success ? result.message : t('ai_processing') || "I understood your request. I'm processing the data for your CropPulse fleet." 
      }])
    }, 600)
  }

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-[#1B4332] text-white rotate-90' : 'bg-[#2D6A4F] text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-[400px] max-h-[600px] bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-ready flex flex-col">
          {/* Header */}
          <div className="p-8 bg-[#1B4332] text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Sparkles size={20} className="text-[#95D5B2]" />
              </div>
              <div>
                <h3 className="font-black tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>CropPulse AI</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#52B788]">{t('nlp_active')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <Languages size={18} className="opacity-40" />
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[400px] selection:bg-[#2D6A4F] selection:text-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-5 rounded-[1.8rem] text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#F5F9F5] text-[#1B4332] font-bold rounded-tr-sm' 
                    : 'bg-[#1B4332] text-white font-medium rounded-tl-sm shadow-xl shadow-emerald-900/10'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAILoading && (
              <div className="flex justify-start">
                <div className="bg-[#1B4332] p-5 rounded-[1.8rem] rounded-tl-sm">
                  <Loader2 size={16} className="animate-spin text-[#95D5B2]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[#FAF7F2] border-t border-[#D8F3DC]/30">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Try: 'Switch to Hindi' or 'How is my soil health?'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-white border border-[#D8F3DC] rounded-2xl py-4 pl-6 pr-24 text-sm font-bold text-[#1B4332] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                 <button className="p-2 text-gray-300 hover:text-[#2D6A4F] transition-colors"><Mic size={20} /></button>
                 <button 
                  onClick={handleSend}
                  className="bg-[#1B4332] text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                 >
                   <Send size={18} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
