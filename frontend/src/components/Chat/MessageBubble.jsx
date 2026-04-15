import { ArrowUpCircle, ShieldCheck } from 'lucide-react';

export default function MessageBubble({ msg, onUpvote, currentUserId }) {
  const isMe = msg.sender_id === currentUserId;
  const isBot = msg.sender_id === 'bot' || msg.type === 'ai';
  const isModerated = msg.is_flagged;

  if (isBot) {
    return (
      <div className="flex justify-start mb-4 animate-fade-in-up">
        <div className="bg-gradient-to-br from-[#1a1205] to-[#161b22] border border-amber-500/20 rounded-2xl rounded-tl-sm p-4 max-w-[85%] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs">
              🤖
            </div>
            <span className="font-semibold text-amber-400 text-sm">KisanBot</span>
            <span className="text-[10px] text-[#8b949e]">Trusted AI</span>
          </div>
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-[#e6edf3]">
            {msg.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in-up`}>
      <div className={`max-w-[75%] ${!isMe && 'flex gap-3'}`}>
        {!isMe && (
          <div className="flex-shrink-0 mt-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: msg.avatar_color || '#16a34a' }}
            >
              {msg.sender_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <div>
          {!isMe && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-sm font-medium text-[#c9d1d9]">{msg.sender_name}</span>
              {msg.trust_score > 0 && (
                <span className="badge-trust flex items-center gap-0.5">
                  <ShieldCheck size={10} /> {msg.trust_score}
                </span>
              )}
            </div>
          )}

          <div className={`relative group ${isMe ? 'msg-bubble-sent text-white' : 'msg-bubble-received text-[#e6edf3]'} p-3 shadow-sm`}>
            {/* Moderation Banner */}
            {isModerated && (
              <div className="moderation-banner mb-2">
                <ShieldCheck size={14} className="shrink-0" />
                <span>{msg.flag_reason || 'Flagged for review'}</span>
              </div>
            )}

            {/* Content */}
            <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap hindi-text">
              {msg.content}
            </div>

            {/* Timestamps & Upvotes */}
            <div className={`flex items-center justify-end gap-3 mt-1.5 min-w-[70px] ${isMe ? 'text-green-200/70' : 'text-[#8b949e]'}`}>
              <span className="text-[10px]">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Upvote Button (External to bubble if not me) */}
            {!isMe && (
              <button
                onClick={() => onUpvote(msg.id)}
                disabled={msg.user_voted}
                className={`absolute -right-8 bottom-0 p-1.5 rounded-full transition-all ${
                  msg.user_voted 
                    ? 'text-amber-400 bg-amber-400/10' 
                    : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] opacity-0 group-hover:opacity-100'
                }`}
                title="Helpful advice"
              >
                <div className="flex flex-col items-center">
                  <ArrowUpCircle size={18} className={msg.user_voted ? "fill-amber-400/20" : ""} />
                  {msg.upvotes > 0 && <span className="text-[10px] font-bold mt-0.5 leading-none">{msg.upvotes}</span>}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
