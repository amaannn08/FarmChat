import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Users, Search, Plus, MapPin, Hash, ShieldCheck, Activity, Bot } from 'lucide-react';

export default function Sidebar({ activeGroup, setActiveGroup }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await axios.get('/groups');
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e, group) => {
    e.stopPropagation();
    try {
      await axios.post(`/groups/${group.id}/join`);
      setGroups(groups.map(g => g.id === group.id ? { ...g, joined: true, member_count: g.member_count + 1 } : g));
      setActiveGroup({ ...group, joined: true });
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  const myGroups = groups.filter(g => g.joined);
  const discoverGroups = groups.filter(g => !g.joined);

  return (
    <div className="w-full h-full flex flex-col bg-[#161b22]">
      {/* Header Profile */}
      <div className="p-4 border-b border-[#30363d] bg-[#0d1117] flex justify-between items-center">
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

      {/* Group List List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 rounded-xl shimmer"></div>
            ))}
          </div>
        ) : (
          <>
            {myGroups.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#8b949e] mb-3 px-2 flex items-center justify-between">
                  My Groups
                  <span className="bg-[#21262d] text-[#c9d1d9] px-2 py-0.5 rounded-full text-[10px]">{myGroups.length}</span>
                </h3>
                <div className="space-y-1">
                  {myGroups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => setActiveGroup(group)}
                      className={`sidebar-item flex items-center gap-3 ${activeGroup?.id === group.id ? 'active' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        group.type === 'village' ? 'bg-blue-500/10 text-blue-400' : 
                        group.type === 'expert' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {group.type === 'village' ? <MapPin size={18} /> : 
                         group.type === 'expert' ? <ShieldCheck size={18} /> : <Hash size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[15px] truncate text-[#e6edf3]">{group.name}</div>
                        <div className="text-xs text-[#8b949e] truncate flex items-center gap-1.5 mt-0.5">
                          <Users size={12} /> {group.member_count} farmers
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {discoverGroups.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#8b949e] mb-3 px-2">Discover Communities</h3>
                <div className="space-y-1">
                  {discoverGroups.map(group => (
                    <div
                      key={group.id}
                      className="sidebar-item flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#21262d] flex items-center justify-center shrink-0 text-[#8b949e]">
                        {group.type === 'village' ? <MapPin size={18} /> : 
                         group.type === 'expert' ? <ShieldCheck size={18} /> : <Hash size={18} />}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-[14px] truncate text-[#c9d1d9]">{group.name}</div>
                        <div className="text-xs text-[#8b949e] flex items-center gap-1.5 mt-0.5">
                          {group.member_count} members
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleJoin(e, group)}
                        className="bg-[#21262d] text-[#e6edf3] px-3 py-1 rounded-md text-xs font-medium hover:bg-green-500/20 hover:text-green-400 transition-colors border border-[#30363d] shrink-0"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
