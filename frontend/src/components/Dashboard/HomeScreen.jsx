import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import WeatherWidget from '../Features/WeatherWidget';
import MandiPrices from '../Features/MandiPrices';
import SchemeAlerts from '../Features/SchemeAlerts';
import { ShieldCheck } from 'lucide-react';

export default function HomeScreen() {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="w-full h-full flex flex-col bg-[#161b22] overflow-hidden">
      {/* Header Profile */}
      <div className="p-4 border-b border-[#30363d] bg-[#0d1117] flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{ backgroundColor: user?.avatar_color || '#16a34a' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#e6edf3] leading-tight flex items-center gap-1.5">
              {user?.name}
              {user?.trust_score > 5 && <ShieldCheck size={14} className="text-amber-400" />}
            </div>
            <div className="text-xs text-[#8b949e] flex items-center gap-1 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse-green' : 'bg-red-500'}`}></span>
              {connected ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        <div>
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#8b949e] px-1 mb-3">Daily Smart Insights</h2>
          <div className="space-y-4">
            <WeatherWidget />
            <MandiPrices />
            <SchemeAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}
