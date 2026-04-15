import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import { Send, Mic, Image as ImageIcon, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ChatWindow({ group, onBack }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    fetchMessages();

    if (socket && connected) {
      socket.emit('join_group', { groupId: group.id });

      socket.on('new_message', (msg) => {
        if (msg.group_id === group.id) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
      });

      socket.on('user_typing', ({ name, groupId }) => {
        if (groupId === group.id) {
          setTypingUsers(prev => new Set(prev).add(name));
        }
      });

      socket.on('user_stop_typing', ({ name, groupId }) => {
        if (groupId === group.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(name);
            return newSet;
          });
        }
      });

      socket.on('message_upvoted', ({ messageId, upvotes }) => {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, upvotes, user_voted: m.user_voted || true } : m
        ));
      });
    }

    return () => {
      if (socket && connected) {
        socket.emit('leave_group', { groupId: group.id });
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('message_upvoted');
      }
    };
  }, [group, socket, connected]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/messages/${group.id}`);
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTyping && socket && connected) {
      setIsTyping(true);
      socket.emit('typing', { groupId: group.id });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && connected) socket.emit('stop_typing', { groupId: group.id });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !connected) return;

    socket.emit('send_message', {
      groupId: group.id,
      content: input,
      type: 'text'
    });
    
    setInput('');
    setIsTyping(false);
    socket.emit('stop_typing', { groupId: group.id });

    // AI hook for demo purposes
    if (input.toLowerCase().includes('@kisanbot') || input.toLowerCase().includes('bot ')) {
      try {
        const { data } = await axios.post('/ai/ask', { question: input, language: user.language_pref });
        // The bot response doesn't actually go through socket for the demo, we push it locally
        const botMsg = {
          id: Date.now().toString(),
          group_id: group.id,
          sender_id: 'bot',
          content: data.answer,
          type: 'ai',
          created_at: new Date().toISOString()
        };
        setTimeout(() => {
          setMessages(prev => [...prev, botMsg]);
          scrollToBottom();
        }, 1000);
      } catch (err) {
        console.error('AI Error:', err);
      }
    }
  };

  const handleUpvote = (msgId) => {
    if (socket && connected) {
      socket.emit('upvote_message', { messageId: msgId, groupId: group.id });
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, upvotes: m.upvotes + 1, user_voted: true } : m
      ));
    }
  };

  if (!group) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-[#8b949e]">
        <div className="w-16 h-16 rounded-full bg-[#161b22] flex items-center justify-center mb-4 border border-[#30363d]">
          <CheckCircle size={32} className="text-green-500/50" />
        </div>
        <p>Select a group from the sidebar to start connected farming.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] relative">
      {/* Header */}
      <div className="glass z-10 px-4 py-3 flex items-center justify-between border-b border-[#30363d] sticky top-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 -ml-1 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-lg transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-[17px] font-bold text-[#e6edf3] flex items-center gap-2">
              {group.name}
              {group.type === 'expert' && <ShieldCheck size={18} className="text-purple-400" />}
            </h2>
            <p className="text-xs text-[#8b949e] leading-none">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-green">{group.member_count} Members</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        {!loading && messages.length === 0 && (
          <div className="text-center text-[#8b949e] mt-10 p-6 bg-[#161b22] rounded-xl border border-[#30363d] mx-auto max-w-md">
            <p className="mb-2">No messages yet in this group.</p>
            <p className="text-sm">Be the first to share an update, ask a question, or say mentioning <code className="text-amber-400 bg-amber-400/10 px-1 rounded">@KisanBot</code> for AI advice.</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center my-10">
            <div className="typing-dot"></div><div className="typing-dot mx-1"></div><div className="typing-dot"></div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              msg={msg} 
              currentUserId={user?.id}
              onUpvote={handleUpvote}
            />
          ))
        )}
        
        {typingUsers.size > 0 && (
          <div className="text-[11px] text-[#8b949e] italic mb-2 ml-10 flex items-center gap-2">
            <span>{Array.from(typingUsers).join(', ')} is typing</span>
            <div className="flex gap-1"><div className="w-1 h-1 bg-[#8b949e] rounded-full animate-bounce"></div><div className="w-1 h-1 bg-[#8b949e] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div><div className="w-1 h-1 bg-[#8b949e] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#161b22] border-t border-[#30363d]">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
          <button type="button" className="btn-icon bg-[#21262d] flex-shrink-0" title="Audio disabled for demo">
            <Mic size={20} />
          </button>
          <button type="button" className="btn-icon bg-[#21262d] flex-shrink-0" title="Image upload disabled for demo">
            <ImageIcon size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={group.type === 'expert' ? "Ask the agronomist a question..." : "Type a message or use @KisanBot for AI advice..."}
            className="input-dark flex-1 px-4 text-[15px]" 
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="btn-primary w-12 h-[42px] p-0 justify-center flex-shrink-0 disabled:opacity-50"
          >
            <Send size={18} className="translate-x-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
