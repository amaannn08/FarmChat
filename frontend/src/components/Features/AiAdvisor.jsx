import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from '../Chat/MessageBubble';
import { Send, Mic, Image as ImageIcon, Bot, ArrowLeft } from 'lucide-react';

export default function AiAdvisor({ onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender_id: 'bot',
      content: 'नमस्ते! I am KisanBot, your personalized 24/7 AI agronomist. How can I help you today?',
      type: 'ai',
      created_at: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.name,
      avatar_color: user.avatar_color,
      content: input,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await axios.post('/ai/ask', { question: input, language: user.language_pref });
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender_id: 'bot',
        content: data.answer,
        type: 'ai',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender_id: 'bot',
        content: "I am having trouble connecting right now. Please try again in a moment.",
        type: 'ai',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] relative">
      <div className="glass z-10 px-4 py-3 flex items-center border-b border-[#30363d] sticky top-0 gap-2">
        <button onClick={onBack} className="p-1 -ml-1 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-[17px] font-bold text-amber-400 flex items-center gap-2">
            <Bot size={20} /> KisanBot Advisor
          </h2>
          <p className="text-xs text-[#8b949e] leading-none">Personalized Agronomy</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              msg={msg} 
              currentUserId={user?.id}
              onUpvote={() => {}} 
            />
          ))}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-gradient-to-br from-[#1a1205] to-[#161b22] border border-amber-500/20 rounded-2xl p-4 max-w-[85%] shadow-lg">
                 <div className="flex gap-1 items-center h-2">
                   <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                   <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-[#161b22] border-t border-[#30363d]">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
          <button type="button" className="btn-icon bg-[#21262d] flex-shrink-0" title="Audio disabled for demo">
            <Mic size={20} />
          </button>
          <button type="button" className="btn-icon bg-[#21262d] flex-shrink-0" title="Upload Image for Disease Detection">
            <ImageIcon size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about farming, crops, or diseases..."
            className="input-dark flex-1 px-4 text-[15px]" 
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="btn-primary w-12 h-[42px] p-0 justify-center flex-shrink-0 disabled:opacity-50"
          >
            <Send size={18} className="translate-x-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
