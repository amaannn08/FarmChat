import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, IndianRupee, Loader2, ArrowRight } from 'lucide-react';

export default function MandiPrices() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data } = await axios.get('/mandi');
      setPrices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-40 rounded-xl shimmer"></div>;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-md">
      <div className="p-4 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]">
        <h3 className="text-[15px] font-bold text-[#e6edf3] flex items-center gap-2">
          <IndianRupee size={16} className="text-green-400" /> Live Mandi Rates
        </h3>
        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Updated Today</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] uppercase bg-[#21262d] text-[#8b949e]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Crop & Market</th>
              <th className="px-4 py-2.5 font-medium text-right">Modal Price (₹)</th>
              <th className="px-4 py-2.5 font-medium text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {prices.slice(0, 5).map((item) => {
              // Simulated trend logic for UI
              const isUp = item.modal_price > item.min_price + ((item.max_price - item.min_price) / 2);
              
              return (
                <tr key={item.id} className="hover:bg-[#21262d] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#e6edf3]">{item.crop}</div>
                    <div className="text-[11px] text-[#8b949e]">{item.market}, {item.state}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-[#c9d1d9]">{Number(item.modal_price).toFixed(0)}</div>
                    <div className="text-[10px] text-[#8b949e]">/ {item.unit}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isUp ? (
                      <TrendingUp size={16} className="text-green-500 mx-auto" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <button className="w-full p-2.5 text-xs text-[#8b949e] font-medium hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex items-center justify-center gap-1 border-t border-[#30363d]">
        View All Markets <ArrowRight size={12} />
      </button>
    </div>
  );
}
