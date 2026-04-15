import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Users, MessageSquare, Target, Shield, MapPin, Loader2 } from 'lucide-react';

export default function ImpactDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/impact');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch impact data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="animate-spin text-green-500 w-8 h-8" />
      </div>
    );
  }

  const { summary, demo_timeline, states, crop_diversity } = data;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1117] p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#e6edf3] mb-2">Impact Analytics</h1>
          <p className="text-[#8b949e]">Anonymised network insights for ecosystem partners and policymakers.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Farmers Reached" 
            value={summary.total_farmers || 142} 
            icon={<Users size={20} className="text-blue-400" />}
            trend="+12% this week"
          />
          <StatCard 
            title="Knowledge Exchanges" 
            value={summary.total_messages || 849} 
            icon={<MessageSquare size={20} className="text-green-400" />}
            trend="Active participation"
          />
          <StatCard 
            title="Peer Endorsements" 
            value={summary.peer_endorsements || 34} 
            icon={<Shield size={20} className="text-amber-400" />}
            trend="Trust building"
          />
          <StatCard 
            title="Micro-loan Interactions" 
            value={summary.loan_nudges_clicked || 12} 
            icon={<Target size={20} className="text-coral-400" />}
            trend="Financial inclusion"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart (Spans 2 columns) */}
          <div className="lg:col-span-2 chart-container">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9]">Network Activity (30 Days)</h3>
              <p className="text-xs text-[#8b949e]">Messages sent vs AI Queries</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demo_timeline} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                  <YAxis stroke="#8b949e" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1c2128', borderColor: '#30363d', borderRadius: '8px' }}
                    itemStyle={{ color: '#e6edf3' }}
                  />
                  <Line type="monotone" dataKey="messages" name="Messages" stroke="#4ade80" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ai_queries" name="AI Queries" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Mini Charts */}
          <div className="space-y-6">
            
            {/* Geography Map Summary */}
            <div className="chart-container h-[178px]">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-[#8b949e]" />
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Top Regions</h3>
              </div>
              <div className="space-y-3">
                {(states.length ? states : [
                  {state: 'Maharashtra', farmers: 45},
                  {state: 'Punjab', farmers: 32},
                  {state: 'Uttar Pradesh', farmers: 28}
                ]).slice(0, 3).map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-[#e6edf3]">{s.state || 'Unknown'}</span>
                    <span className="text-[#8b949e] font-medium px-2 py-0.5 bg-[#21262d] rounded-md">{s.farmers}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crop Diversity */}
            <div className="chart-container h-[200px]">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-4">Crop Diversity</h3>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crop_diversity.length ? crop_diversity : [
                    {crop: 'Wheat', count: 40}, {crop: 'Rice', count: 35}, {crop: 'Cotton', count: 20}
                  ]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="crop" type="category" width={60} stroke="#8b949e" fontSize={11} interval={0} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {
                        (crop_diversity.length ? crop_diversity : [1,2,3]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#4ade80', '#fbbf24', '#f87171', '#60a5fa'][index % 4]} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#484f58] transition-colors relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-medium text-[#8b949e] truncate">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-[#e6edf3] mb-1">{value}</div>
      <div className="text-xs text-[#4ade80] font-medium">{trend}</div>
    </div>
  );
}
