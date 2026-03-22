"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, ReferenceArea, BarChart, Bar, Cell, ComposedChart 
} from 'recharts';
import { useThemeStore } from "@/store/useThemeStore.js"; 
import { ChevronLeft, ChevronRight } from "lucide-react";

const Candlestick = (props) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isUp = close >= open;
  
  const color = isUp ? "#02c076" : "#f84960"; 

  const ratio = Math.abs(height / (Math.max(Math.abs(open - close), 0.0001)));
  const wickTop = y + (open - high) * ratio;
  const wickBottom = y + (open - low) * ratio;

  const bodyWidth = Math.max(width * 0.8, 1); 
  const bodyX = x + (width - bodyWidth) / 2;

  return (
    <g>
      {/* Wick (Thin Line) */}
      <line 
        x1={x + width / 2} 
        y1={wickTop} 
        x2={x + width / 2} 
        y2={wickBottom} 
        stroke={color} 
        strokeWidth={1} 
      />
      {/* Body */}
      <rect 
        x={bodyX} 
        y={y} 
        width={bodyWidth} 
        height={Math.max(height, 0.5)} 
        fill={color} 
      />
    </g>
  );
};

export default function Features({ isDashboard = false, onTrade }) {
  const router = useRouter();
  const { isDark } = useThemeStore();
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  const [marketData, setMarketData] = useState({ tickerData: [], chartData: [] });
  const [user, setUser] = useState(null); 
    
  const [chartType, setChartType] = useState("area"); 
  const [zoomData, setZoomData] = useState(null);
  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // LIVE FEATURE STATES
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [priceFlash, setPriceFlash] = useState(null); // 'up', 'down', or null
  const prevPriceRef = useRef(null);

  const itemsPerPage = 10; 
  const chartRef = useRef(null);

  // Auth Sync
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Seconds ago timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((new Date() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/crypto?symbol=${activeSymbol}`);
        const data = await res.json();
        
        // Handle Price Flash Logic
        const newPrice = data.chartData[data.chartData.length - 1]?.close;
        if (prevPriceRef.current !== null && newPrice !== prevPriceRef.current) {
          setPriceFlash(newPrice > prevPriceRef.current ? "up" : "down");
          setTimeout(() => setPriceFlash(null), 1000); 
        }
        prevPriceRef.current = newPrice;

        setMarketData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Refresh failed:", error);
      }
    };

    fetchData(); 
    const interval = setInterval(fetchData, 10000); 

    return () => clearInterval(interval);
  }, [activeSymbol]);

  const handleAction = (coin, type) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (isDashboard && onTrade) {
      onTrade(coin.symbol, parseFloat(coin.lastPrice), type);
    } else {
      router.push("/dashboard");
    }
  };

  const handleZoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === "") {
      setRefAreaLeft(""); setRefAreaRight(""); return;
    }
    let left = refAreaLeft;
    let right = refAreaRight;
    if (refAreaLeft > refAreaRight) [left, right] = [right, left];
    const zoomed = marketData.chartData.filter(d => d.time >= left && d.time <= right);
    setRefAreaLeft(""); setRefAreaRight(""); setZoomData(zoomed);
  };

  const resetZoom = () => setZoomData(null);
  const filtered = marketData.tickerData.filter(c => c.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPaginationGroup = () => {
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) range.push(i);
      else if (i === currentPage - 2 || i === currentPage + 2) range.push("...");
    }
    return [...new Set(range)];
  };

  const handleAnalyze = (symbol) => {
    setActiveSymbol(symbol);
    setZoomData(null);
    chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const currentChartSource = zoomData || marketData.chartData;

  return (
    <section className={`p-1 transition-all duration-300 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CHART TERMINAL */}
        <div ref={chartRef} className={`relative rounded-sm border overflow-hidden ${isDark ? "bg-[#0b0e11] border-white/10" : "bg-white border-black/5"}`}>
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-inherit">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                {/* LIVE PULSE INDICATOR */}
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>

                <h1 className="text-xl md:text-2xl font-black tracking-tight opacity-90 uppercase">
                  {activeSymbol.replace("USDT", "")} / USDT
                </h1>
                
                {/* TEXT-BASED TOGGLE */}
                <div className="flex items-center bg-black/10 dark:bg-white/5 p-1 rounded-sm border border-white/5">
                  <button 
                    onClick={() => setChartType("area")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-sm ${chartType === 'area' ? "bg-yellow-500 text-black shadow-sm" : "opacity-40 hover:opacity-100"}`}
                  >
                    Line
                  </button>
                  <button 
                    onClick={() => setChartType("candle")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded-sm ${chartType === 'candle' ? "bg-yellow-500 text-black shadow-sm" : "opacity-40 hover:opacity-100"}`}
                  >
                    Candle
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Live Connection</span>
                <span className="text-[9px] opacity-30 font-mono italic">Updated {secondsAgo}s ago</span>
                {zoomData && (
                  <button onClick={resetZoom} className="text-[10px] text-yellow-500 hover:underline font-bold uppercase tracking-tighter">
                    • Reset Zoom ↺
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter">Current Market Price</p>
              <p className={`text-lg md:text-2xl font-mono font-bold transition-all duration-500 tabular-nums ${
                priceFlash === 'up' ? "text-emerald-500 scale-105" : 
                priceFlash === 'down' ? "text-red-500 scale-105" : "text-yellow-500"
              }`}>
                ${currentChartSource[currentChartSource.length - 1]?.close.toLocaleString() || "---"}
              </p>
            </div>
          </div>

          <div className="h-72 md:h-[450px] w-full p-2 md:p-4 cursor-crosshair select-none">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={currentChartSource}
                barCategoryGap={0}
                barGap={0}
                onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel)}
                onMouseUp={handleZoom}
              >
                <defs>
                  <linearGradient id="glassYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 1" vertical={false} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
                <XAxis dataKey="time" tick={{fontSize: 9, fill: '#888'}} axisLine={false} tickLine={false} minTickGap={50} />
                <YAxis orientation="right" domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
                <Tooltip cursor={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', strokeWidth: 1 }} contentStyle={{ backgroundColor: isDark ? '#161a1e' : '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', color: isDark ? '#fff' : '#000' }} />
                
                {chartType === "area" ? (
                  <Area type="monotone" dataKey="close" stroke="#FFD700" strokeWidth={2} fill="url(#glassYellow)" isAnimationActive={false} />
                ) : (
                  <>
                    <Bar dataKey="close" shape={<Candlestick />} isAnimationActive={false} />
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5} 
                      fill="transparent" 
                      dot={false}
                      isAnimationActive={false} 
                    />
                  </>
                )}

                {refAreaLeft && refAreaRight && (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#FFD700" fillOpacity={0.1} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MARKET TABLE */}
        <div className={`rounded-sm border overflow-hidden ${isDark ? "bg-[#0b0e11] border-white/10" : "bg-white border-black/5"}`}>
          <div className="p-4 border-b border-inherit flex flex-col md:flex-row gap-4 justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-60">Available Assets</h2>
            <input 
              type="text" placeholder="Filter Assets..."
              className={`w-full md:w-64 text-xs px-4 py-2 rounded-sm border outline-none ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-100 border-black/10 text-black"}`}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px] border-collapse">
              <thead className={`text-[10px] uppercase font-black opacity-40 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-right">24h Volatility</th>
                  <th className="p-4 text-right">Volume</th>
                  <th className="p-4 text-center">Logic</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12px] divide-y divide-inherit">
                {currentItems.map((coin, index) => {
                  const isUp = parseFloat(coin.priceChangePercent) >= 0;
                  const isActive = activeSymbol === coin.symbol;
                  return (
                    <tr key={coin.symbol} className={`group hover:bg-yellow-500/5 transition-colors ${isActive ? "bg-yellow-500/[0.05]" : ""}`}>
                      <td className="p-4 text-center opacity-30 font-mono text-[10px]">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-4 font-black tracking-tight">
                        <div className="flex items-center gap-2">
                          {isActive && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
                          {coin.symbol.replace("USDT", "")}
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono font-bold tabular-nums transition-colors duration-500 ${
                        isActive && priceFlash === 'up' ? "text-emerald-500" : 
                        isActive && priceFlash === 'down' ? "text-red-500" : ""
                      }`}>
                        ${parseFloat(coin.lastPrice).toLocaleString()}
                      </td>
                      <td className={`p-4 text-right font-bold tabular-nums ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                        {isUp ? "▲" : "▼"} {Math.abs(coin.priceChangePercent)}%
                      </td>
                      <td className="p-4 text-right font-mono opacity-50 text-[10px] tabular-nums">${parseFloat(coin.quoteVolume).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      
                      <td className="p-4 text-center">
                        <button onClick={() => handleAnalyze(coin.symbol)} className={`text-[9px] px-3 py-1 rounded-sm font-black uppercase transition-all ${isActive ? "bg-emerald-500 text-white" : "border border-inherit hover:border-yellow-500"}`}>
                          View Chart
                        </button>
                      </td>
                      <td className="p-4 text-right w-px whitespace-nowrap">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleAction(coin, 'BUY')} 
                            className="bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase px-5 py-1.5 rounded-sm active:scale-95 transition-transform"
                          >
                            Buy
                          </button>
                          {!isDashboard && (
                            <button 
                              onClick={() => handleAction(coin, 'SELL')} 
                              className={`border border-inherit text-[10px] font-black uppercase px-5 py-1.5 rounded-sm transition-all ${isDark ? "hover:bg-red-500/20" : "hover:bg-red-50"}`}
                            >
                              Sell
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 border-t border-inherit flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-black uppercase opacity-30 tracking-widest">
              Terminal Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={`w-7 h-7 flex items-center justify-center rounded-sm border border-inherit transition-all
                  ${currentPage === 1 ? "opacity-20 cursor-not-allowed" : "hover:border-yellow-500 hover:text-yellow-500"}`}
              >
                <ChevronLeft size={14} strokeWidth={3} />
              </button>

              <div className="flex gap-1">
                {getPaginationGroup().map((item, i) => (
                  <button key={i} disabled={item === "..."} onClick={() => typeof item === "number" && setCurrentPage(item)}
                    className={`w-7 h-7 rounded-sm text-[10px] font-bold transition-all ${currentPage === item ? "bg-yellow-500 text-black border-yellow-500" : "border border-inherit hover:border-yellow-500"}`}>
                    {item}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={`w-7 h-7 flex items-center justify-center rounded-sm border border-inherit transition-all
                  ${currentPage === totalPages ? "opacity-20 cursor-not-allowed" : "hover:border-yellow-500 hover:text-yellow-500"}`}
              >
                <ChevronRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}