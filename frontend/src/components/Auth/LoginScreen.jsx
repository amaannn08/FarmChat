import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('hi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('Please enter a valid 10-digit number');
    
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/auth/send-otp', { phone });
      
      if (data.autoLogin) {
        login(data.user, data.token);
      } else {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Please enter the 6-digit OTP');

    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/auth/verify-otp', {
        phone,
        otp,
        name: name || 'Kisan',
        language_pref: language,
      });
      login(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="max-w-md w-full glass-strong rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden animate-bounce-in">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-4 animate-pulse-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2z"></path><path d="M8 22h8"></path><path d="M2.5 13 12 3l9.5 10"></path></svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text-green mb-2 hindi-text">
              KisanSaathi
            </h1>
            <p className="text-[#8b949e]">The Farmer's Digital Companion</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] flex items-center gap-1 font-medium">
                    <Phone size={16} /> +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit number"
                    className="input-dark pl-16 py-3 text-lg tracking-wider"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full justify-center btn-primary py-3 text-base shadow-[0_0_20px_rgba(34,197,94,0.15)] mt-6 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-slide-right">
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-1 text-center">
                  Enter 6-digit OTP sent to +91 {phone}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="input-dark text-center text-2xl tracking-[0.5em] py-3 mt-2"
                  autoFocus
                  required
                />
                <p className="text-center text-xs text-[#8b949e] mt-2">Demo: Use 123456</p>
              </div>

              <div className="pt-4 border-t border-[#30363d]">
                <label className="block text-sm font-medium text-[#c9d1d9] mb-1">Your Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ram Kumar"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Preferred Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'hi', label: 'हिंदी' },
                    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
                    { code: 'mr', label: 'मराठी' },
                    { code: 'en', label: 'English' },
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={`py-2 px-3 border rounded-lg text-sm text-center transition-all ${
                        language === lang.code
                          ? 'border-green-500 bg-green-500/10 text-green-400 font-medium'
                          : 'border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:bg-[#21262d]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full btn-primary justify-center py-3 mt-4 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Enter Farmer Network'}
                {!loading && <CheckCircle2 size={18} />}
              </button>
            </form>
          )}
        </div>
        
        {step === 1 && (
          <div className="bg-[#161b22] p-4 text-center border-t border-[#30363d]">
            <p className="text-xs text-[#8b949e] max-w-[250px] mx-auto leading-relaxed">
              By logging in, you join thousands of farmers sharing knowledge and market insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
