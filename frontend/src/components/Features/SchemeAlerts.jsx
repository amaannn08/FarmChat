import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, ExternalLink, ShieldAlert } from 'lucide-react';

export default function SchemeAlerts() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const { data } = await axios.get('/schemes');
        setSchemes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  if (loading) return <div className="h-32 rounded-xl shimmer"></div>;
  if (!schemes.length) return null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-md">
      <div className="p-3 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]">
        <h3 className="text-[13px] font-bold text-[#e6edf3] flex items-center gap-2">
          <Bell size={14} className="text-purple-400" /> Govt Schemes
        </h3>
        <span className="bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded text-[10px] font-medium border border-[#30363d]">
          {schemes.length} Active
        </span>
      </div>

      <div className="max-h-[250px] overflow-y-auto divide-y divide-[#30363d]">
        {schemes.map(scheme => (
          <div key={scheme.id} className="p-3 hover:bg-[#21262d] transition-colors relative group">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-purple-400">
                {scheme.category === 'insurance' ? <ShieldAlert size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-1">{scheme.title}</h4>
                <p className="text-[11px] text-[#8b949e] leading-snug line-clamp-2 mb-2">{scheme.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-coral-400">
                    {scheme.deadline ? `Deadline: ${new Date(scheme.deadline).toLocaleDateString()}` : 'Ongoing'}
                  </span>
                  {scheme.link && (
                    <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 font-medium z-10 relative">
                      Apply <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            {/* Clickable overlay except for the link */}
            <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0"></a>
          </div>
        ))}
      </div>
    </div>
  );
}
