"use client";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore.js"; 
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Target, 
  ShieldAlert, 
  Zap, 
  BarChart3, 
  Search, 
  TrendingUp, 
  Activity, 
  Brain, 
  Sparkles, 
  Gauge, 
  Clock, 
  Cpu,
  CheckCircle2
} from "lucide-react";

export default function AIInsightPage() {
  const { isDark } = useThemeStore(); 
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [allSymbols, setAllSymbols] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeType, setTradeType] = useState("LONG");
  const [riskLevel, setRiskLevel] = useState("CONSERVATIVE");
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState({ tickerData: [], chartData: [] });

  // 1. Fetch symbols
  useEffect(() => {
    fetch("/api/ai-insights?mode=symbols")
      .then(res => res.json())
      .then(data => setAllSymbols(Array.isArray(data) ? data : []));
  }, []);

  // 2. Fetch market data for active symbol
  useEffect(() => {
    const fetchMarket = async () => {
      const res = await fetch(`/api/ai-insights?symbol=${activeSymbol}`);
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    };
    fetchMarket();
    const inv = setInterval(fetchMarket, 15000);
    return () => clearInterval(inv);
  }, [activeSymbol]);

  const generateAIInsight = async () => {
    setLoading(true);
    const price = marketData.chartData[marketData.chartData.length - 1]?.price;
    const res = await fetch("/api/ai-insights", {
      method: "POST",
      body: JSON.stringify({
        symbol: activeSymbol, price, 
        change: marketData.tickerData[0]?.priceChangePercent,
        type: tradeType, risk: riskLevel
      }),
    });
    const data = await res.json();
    setInsight(data);
    setLoading(false);
  };

  const filteredSymbols = allSymbols.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50);

  const themeClass = isDark ? "bg-[#050505] text-white" : "bg-slate-50 text-black";
  const cardClass = isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10 shadow-sm";
  const inputClass = isDark ? "bg-black border-white/10 text-white" : "bg-gray-50 border-black/10 text-black";

  const formatPrice = (price) => {
    if (!price) return "—";
    return `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${themeClass}`}>
      <Navbar />

      {/* MODIFICATION 1: Added pt-24 to ensure content starts below the fixed Navbar */}
      <main className="flex-grow w-full max-w-[1800px] mx-auto p-4 md:p-8 pt-24 pb-12 lg:grid lg:pt-20 lg:grid-cols-12 lg:gap-8">
        
        {/* LEFT SECTION */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`border rounded-xl overflow-hidden flex flex-col h-[450px] lg:h-[500px] transition-colors duration-500 ${cardClass}`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-black/[0.01]'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Activity size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em]">Live Analytics</span>
                  <h1 className="text-l font-black tracking-tighter">
                    {activeSymbol.replace("USDT","")} <span className="text-sm opacity-30 font-medium">/ USDT</span>
                  </h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] opacity-40 uppercase font-bold tracking-wider mb-1">Market Price</p>
                <p className={`text-3xl font-mono font-bold tabular-nums tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                  {formatPrice(marketData.chartData[marketData.chartData.length - 1]?.price)}
                </p>
              </div>
            </div>
            
            <div className="flex-grow p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketData.chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#ffffff10" : "#00000010"} />
                  <XAxis dataKey="time" tick={{fontSize: 10, fill: '#666'}} minTickGap={60} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: '12px'}} />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} fill="url(#chartGradient)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VERDICT BOX */}
          <div className={`border rounded-xl overflow-hidden ${cardClass}`}>
            <div className={`p-5 border-b ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-50'}`}>
              <div className="flex items-center gap-3">
                <Brain className="text-emerald-500" />
                <h3 className="text-lg font-bold">Consensus Execution Verdict</h3>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-3 gap-4"><div className="h-20 bg-gray-500/10 rounded-xl" /><div className="h-20 bg-gray-500/10 rounded-xl" /><div className="h-20 bg-gray-500/10 rounded-xl" /></div>
                  <div className="h-24 bg-gray-500/10 rounded-xl" />
                </div>
              ) : insight ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                      <p className="text-[10px] uppercase text-emerald-500 font-bold mb-1">Entry</p>
                      <p className="text-xl font-mono font-bold">{formatPrice(insight.entry)}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                      <p className="text-[10px] uppercase text-blue-500 font-bold mb-1">Take Profit</p>
                      <p className="text-xl font-mono font-bold">{formatPrice(insight.tp)}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                      <p className="text-[10px] uppercase text-red-500 font-bold mb-1">Stop Loss</p>
                      <p className="text-xl font-mono font-bold">{formatPrice(insight.sl)}</p>
                    </div>
                  </div>
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-black/5'}`}>
                    <h4 className="text-[10px] font-black uppercase text-emerald-500 mb-2">Neural Execution Logic</h4>
                    <p className="text-sm leading-relaxed">{insight.decision}</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center opacity-40">
                  <Zap size={48} className="mx-auto mb-4 text-emerald-500" />
                  <p className="text-sm font-bold uppercase">System Idle</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="lg:col-span-4 space-y-6 mt-6 lg:mt-0">
          <div className={`border p-6 rounded-xl ${cardClass}`}>
            <h2 className="text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-6 flex items-center gap-2">
              <Cpu size={14} /> System Config
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase opacity-50 font-bold mb-2 block tracking-wider">Asset Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search symbol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full border p-3 pl-9 rounded-xl text-sm outline-none transition-all font-medium ${inputClass} focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                  />
                  {searchTerm && (
                    <div className={`absolute z-50 w-full mt-2 max-h-56 overflow-y-auto rounded-xl shadow-xl border ${isDark ? 'bg-[#0d0d0d] border-white/20' : 'bg-white border-black/10'}`}>
                      {filteredSymbols.map(s => {
                        const isActive = activeSymbol === s;
                        return (
                          <button 
                            key={s} 
                            onClick={() => { setActiveSymbol(s); setSearchTerm(""); }}
                            className={`w-full text-left p-3 text-xs font-medium border-b last:border-0 transition-all flex items-center justify-between
                              ${isActive 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                : isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-black/5 border-black/5'
                              }`}
                          >
                            <span>{s}</span>
                            {/* MODIFICATION 2: Visual Indicator for currently selected symbol */}
                            {isActive && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Active Ticket Display */}
                <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <span className="text-[10px] font-bold uppercase opacity-50">Active Ticket</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-mono font-bold text-emerald-500">{activeSymbol}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase opacity-50 font-bold mb-2 block tracking-wider">Trade Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTradeType("LONG")} className={`py-3 text-xs font-bold rounded-xl border transition-all ${tradeType === 'LONG' ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg' : 'opacity-40'}`}>LONG ▲</button>
                  <button onClick={() => setTradeType("SHORT")} className={`py-3 text-xs font-bold rounded-xl border transition-all ${tradeType === 'SHORT' ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'opacity-40'}`}>SHORT ▼</button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase opacity-50 font-bold mb-2 block tracking-wider">Risk Profile</label>
                <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={`w-full border p-3 rounded-xl text-xs font-medium cursor-pointer ${inputClass} focus:border-emerald-500`}>
                  <option value="CONSERVATIVE">🛡️ Conservative</option>
                  <option value="AGGRESSIVE">⚡ Aggressive</option>
                  <option value="DEGEN">🚀 High Vol</option>
                </select>
              </div>

              <button 
                onClick={generateAIInsight}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? "Analyzing..." : <><Sparkles size={14} /> Execute Analysis</>}
              </button>
            </div>
          </div>

          <div className={`border p-6 rounded-xl transition-colors duration-500 ${cardClass}`}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Neural Log Stream</h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {insight?.discussions?.map((msg, i) => (
                <div key={i} className="border-l-2 border-emerald-500/30 pl-3 py-1">
                  <p className="text-[9px] font-bold uppercase mb-1 text-emerald-500">{msg.role}</p>
                  <p className="text-[10px] opacity-70 leading-relaxed">{msg.content}</p>
                </div>
              )) || <p className="text-[10px] opacity-30 text-center py-4">No logs available</p>}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}