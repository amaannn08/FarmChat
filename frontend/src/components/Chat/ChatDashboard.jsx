import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import AiAdvisor from '../Features/AiAdvisor';
import ImpactDashboard from '../Dashboard/ImpactDashboard';
import HomeScreen from '../Dashboard/HomeScreen';
import { Home, Users, Bot, Activity } from 'lucide-react';
import { GlassFilter } from '../ui/liquid-radio';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export default function ChatDashboard() {
  const [activeGroup, setActiveGroup] = useState(null);
  const [view, setView] = useState('home'); // 'home' | 'chats' | 'chat' | 'ai' | 'impact'

  const navigateTo = (newView) => {
    setView(newView);
    if (newView !== 'chat') setActiveGroup(null);
  };

  const handleGroupSelect = (g) => {
    setActiveGroup(g);
    setView('chat');
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-[#0d1117] relative">
      {/* Main Content Area - UI Caching implemented via CSS 'flex' vs 'hidden' */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        
        <div className={`flex-1 flex-col h-full bg-[#0d1117] ${view === 'home' ? 'flex' : 'hidden'}`}>
          <HomeScreen />
        </div>

        <div className={`flex-1 flex-col h-full bg-[#0d1117] ${view === 'chats' ? 'flex' : 'hidden'}`}>
          <Sidebar 
            activeGroup={activeGroup} 
            setActiveGroup={handleGroupSelect} 
          />
        </div>
        
        <div className={`flex-1 flex-col h-full bg-[#0d1117] ${view === 'chat' && activeGroup ? 'flex' : 'hidden'}`}>
          {activeGroup && <ChatWindow group={activeGroup} onBack={() => navigateTo('chats')} />}
        </div>

        <div className={`flex-1 flex-col h-full bg-[#0d1117] ${view === 'ai' ? 'flex' : 'hidden'}`}>
          <AiAdvisor onBack={() => navigateTo('home')} />
        </div>

        <div className={`flex-1 flex-col h-full overflow-y-auto w-full ${view === 'impact' ? 'flex' : 'hidden'}`}>
          <ImpactDashboard />
        </div>
      </div>

      {/* Bottom Mobile Navigation (Liquid Radio) */}
      {view !== 'chat' && (
         <div className="bg-[#161b22] border-t border-[#30363d] p-3 pb-[calc(max(env(safe-area-inset-bottom),8px))] flex justify-center z-20">
            <div className="w-full max-w-[400px] h-14 rounded-2xl bg-[#0d1117] p-1 shadow-inner relative">
              <RadioGroup
                value={view === 'chat' ? 'chats' : view}
                onValueChange={navigateTo}
                className="group relative inline-grid grid-cols-4 h-full w-full items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/4 after:rounded-xl after:bg-white/10 after:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] after:transition-transform after:duration-500 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=home]:after:translate-x-0 data-[state=chats]:after:translate-x-full data-[state=ai]:after:translate-x-[200%] data-[state=impact]:after:translate-x-[300%]"
              >
                <div
                  className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-xl pointer-events-none"
                  style={{ filter: 'url("#radio-glass")' }}
                />

                <label className={`relative z-10 flex flex-col h-full cursor-pointer select-none items-center justify-center transition-colors ${view === 'home' ? 'text-amber-400' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}>
                  <Home size={22} className={view === 'home' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : ''} />
                  <RadioGroupItem id="nav-home" value="home" className="sr-only" />
                </label>

                <label className={`relative z-10 flex flex-col h-full cursor-pointer select-none items-center justify-center transition-colors ${view === 'chats' ? 'text-green-400' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}>
                  <Users size={22} className={view === 'chats' ? 'drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]' : ''} />
                  <RadioGroupItem id="nav-chats" value="chats" className="sr-only" />
                </label>

                <label className={`relative z-10 flex flex-col h-full cursor-pointer select-none items-center justify-center transition-colors ${view === 'ai' ? 'text-amber-400' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}>
                  <Bot size={22} className={view === 'ai' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : ''} />
                  <RadioGroupItem id="nav-ai" value="ai" className="sr-only" />
                </label>

                <label className={`relative z-10 flex flex-col h-full cursor-pointer select-none items-center justify-center transition-colors ${view === 'impact' ? 'text-blue-400' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}>
                  <Activity size={22} className={view === 'impact' ? 'drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]' : ''} />
                  <RadioGroupItem id="nav-impact" value="impact" className="sr-only" />
                </label>

                <GlassFilter />
              </RadioGroup>
            </div>
         </div>
      )}
    </div>
  );
}
