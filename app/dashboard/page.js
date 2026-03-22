"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/store/useThemeStore.js";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, Mail, Activity, Globe, Zap, 
  X, Loader2, ChevronLeft, ChevronRight, FileText, 
  Clock, TrendingUp, TrendingDown, ShieldCheck, 
  Wallet, BarChart3, ArrowRightLeft, RotateCcw, Download, RefreshCw,
  Bell, CheckCircle2 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Navbar from "@/components/home/Navbar";
import Features from "@/components/home/Features";
import Footer from "@/components/home/Footer";

export default function Dashboard() {
  const { isDark } = useThemeStore();
  const router = useRouter();
  
  const [userMetadata, setUserMetadata] = useState({ name: "Operator", email: "auth.verifying...", id: "" });
  const [balances, setBalances] = useState({ spot: 0, futures: 0 });
  const [activePositions, setActivePositions] = useState([]);
  const [pastTrades, setPastTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livePrices, setLivePrices] = useState({});
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  const [amountInput, setAmountInput] = useState("");
  const [tradeModal, setTradeModal] = useState({ open: false, coin: null, wallet: 'SPOT', side: 'LONG' });
  const [sellModal, setSellModal] = useState({ open: false, pos: null });
  const [sellAmountInput, setSellAmountInput] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => { initDashboard(); }, [router]);

  useEffect(() => {
    if (!userMetadata.id) return;

    const notifChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userMetadata.id}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      ).subscribe();

    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev };
        activePositions.forEach(pos => {
          const volatility = 1 + (Math.random() * 0.002 - 0.001); 
          next[pos.symbol] = (next[pos.symbol] || pos.price) * volatility;
        });
        return next;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(notifChannel);
    };
  }, [activePositions, userMetadata.id]);

  const initDashboard = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return router.push("/auth");

    const name = user.user_metadata?.full_name || user.user_metadata?.user_name || user.email.split('@')[0];
    setUserMetadata({ name, email: user.email, id: user.id });

    const { data: profile } = await supabase.from("profiles").select("spot_balance, futures_balance").eq("id", user.id).single();
    if (profile) {
      setBalances({ spot: profile.spot_balance, futures: profile.futures_balance });
    }

    const { data: allTrades } = await supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (allTrades) {
      setActivePositions(allTrades.filter(t => t.status === 'OPEN'));
      setPastTrades(allTrades.filter(t => t.status === 'CLOSED'));
    }

    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (notifs) setNotifications(notifs);

    setLoading(false);
  };

   
  const triggerAlert = async (title, message, type = "SYSTEM") => {
   
    await supabase.from("notifications").insert([{
      user_id: userMetadata.id,
      title,
      message,
      type
    }]);

    // 2. Send Real Email
    try {
      const response = await fetch("/api/send-email", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: userMetadata.email, 
          title, 
          message,
          type 
        }) 
      });
      
      const result = await response.json();
      if (!response.ok) {
        console.error("Email API reported error:", result);
      } else {
        console.log("Email dispatched successfully:", result);
      }
    } catch (err) {
      console.error("Network error during email dispatch:", err);
    }
  };

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userMetadata.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const calculatePnL = (trade, currentPrice = null) => {
    const entry = trade.price;
    const exit = currentPrice || trade.exit_price || entry;
    const amount = trade.amount;
    const isShort = trade.type === 'SHORT';
    const pnlVal = isShort ? (entry - exit) * amount : (exit - entry) * amount;
    const pnlPercent = isShort ? ((entry - exit) / entry) * 100 : ((exit - entry) / entry) * 100;
    return { val: pnlVal.toFixed(2), percent: pnlPercent.toFixed(2), isPos: pnlVal >= 0 };
  };

  const handleAccountReset = async () => {
    const confirmReset = confirm("CRITICAL: Reset balances to $20k Spot / $10k Futures and wipe all trade history?");
    if (!confirmReset) return;

    try {
      setLoading(true);
      const { error: profileError } = await supabase.from("profiles").update({ spot_balance: 20000, futures_balance: 10000 }).eq("id", userMetadata.id);
      const { error: tradeError } = await supabase.from("trades").delete().eq("user_id", userMetadata.id);
      if (profileError || tradeError) throw new Error("Database update failed");

      await triggerAlert("System Reset", "Your account balances have been reset to initial capital.", "SYSTEM");
      await initDashboard();
      alert("System recalibrated. Initial capital restored.");
    } catch (err) {
      console.error("Reset Error:", err.message);
      alert("Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("TRADE SETTLEMENT REPORT", 14, 22);
    const tableRows = pastTrades.map(t => {
      const pnl = calculatePnL(t);
      return [new Date(t.created_at).toLocaleString(), new Date(t.closed_at).toLocaleString(), t.symbol, t.type, `$${t.price}`, `$${t.exit_price}`, `${pnl.val} (${pnl.percent}%)`];
    });
    autoTable(doc, { head: [['Entry Time', 'Exit Time', 'Asset', 'Type', 'Entry', 'Exit', 'PnL']], body: tableRows, startY: 40 });
    doc.save(`Trade_Report.pdf`);
  };

  const executeBuy = async () => {
    const qty = parseFloat(amountInput);
    const totalCost = qty * tradeModal.coin.price;
    const walletKey = tradeModal.wallet === 'SPOT' ? 'spot' : 'futures';

    if (!qty || qty <= 0) return alert("Invalid Qty");
    if (balances[walletKey] < totalCost) return alert("Insufficient Balance");

    const { error: tradeError } = await supabase.from("trades").insert([{
      user_id: userMetadata.id, symbol: tradeModal.coin.symbol,
      type: tradeModal.wallet === 'FUTURES' ? tradeModal.side : 'SPOT BUY',
      price: tradeModal.coin.price, amount: qty,
      wallet_type: tradeModal.wallet, status: 'OPEN',
      created_at: new Date().toISOString()
    }]);

    if (!tradeError) {
      const newBalance = balances[walletKey] - totalCost;
      await supabase.from("profiles").update({ [`${walletKey}_balance`]: newBalance }).eq("id", userMetadata.id);
      
      await triggerAlert(
        "Trade Opened", 
        `Successfully bought ${qty} ${tradeModal.coin.symbol} at $${tradeModal.coin.price}. Total: $${totalCost.toFixed(2)}`,
        "BUY"
      );

      setBalances(prev => ({ ...prev, [walletKey]: newBalance }));
      setTradeModal({ open: false, coin: null });
      setAmountInput("");
      initDashboard();
    }
  };

  const executePartialSell = async () => {
    const sellQty = parseFloat(sellAmountInput);
    const pos = sellModal.pos;
    if (!sellQty || sellQty <= 0 || sellQty > pos.amount) return alert("Invalid Qty");

    const currentMarkPrice = livePrices[pos.symbol] || pos.price;
    const pnl = calculatePnL(pos, currentMarkPrice);
    const walletKey = pos.wallet_type === 'SPOT' ? 'spot' : 'futures';
    const saleRevenue = (sellQty * pos.price) + parseFloat(pnl.val);

    let error = null;
    if (sellQty === pos.amount) {
        const { error: err } = await supabase.from("trades").update({ status: 'CLOSED', exit_price: currentMarkPrice, closed_at: new Date().toISOString() }).eq("id", pos.id);
        error = err;
    } else {
        const { error: err1 } = await supabase.from("trades").update({ amount: pos.amount - sellQty }).eq("id", pos.id);
        const { error: err2 } = await supabase.from("trades").insert([{
            user_id: userMetadata.id, symbol: pos.symbol, type: pos.type,
            price: pos.price, wallet_type: pos.wallet_type, amount: sellQty,
            status: 'CLOSED', exit_price: currentMarkPrice,
            created_at: pos.created_at, closed_at: new Date().toISOString()
        }]);
        error = err1 || err2;
    }

    if (!error) {
        const newBalance = balances[walletKey] + saleRevenue;
        await supabase.from("profiles").update({ [`${walletKey}_balance`]: newBalance }).eq("id", userMetadata.id);
        
        await triggerAlert(
          "Position Settled", 
          `Closed ${sellQty} of ${pos.symbol} at $${currentMarkPrice.toFixed(2)}. PnL: ${pnl.val} USDT.`,
          "SELL"
        );

        setBalances(prev => ({ ...prev, [walletKey]: newBalance }));
        setSellModal({ open: false, pos: null });
        initDashboard();
    }
  };

  const realizedPnL = useMemo(() => {
    let total = 0;
    pastTrades.forEach(t => { total += parseFloat(calculatePnL(t).val); });
    return total;
  }, [pastTrades]);

  const currentTrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return pastTrades.slice(start, start + itemsPerPage);
  }, [pastTrades, currentPage]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505] font-mono text-yellow-500 uppercase tracking-widest"><Loader2 className="animate-spin mr-2" /> Decrypting Node...</div>;

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#050505] text-white" : "bg-slate-50 text-slate-900"}`}>
      <Navbar />
      
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto space-y-6 font-sans">
        {/* TOP CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`p-6 border rounded-sm ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-sm"><UserIcon size={20} className="text-emerald-500" /></div>
                  <div className="text-[9px] font-black text-emerald-500 uppercase"><ShieldCheck size={10} className="inline mr-1"/> Active</div>
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight">{userMetadata.name}</h2>
                <p className="text-[10px] opacity-50 font-mono flex items-center gap-2 mb-4"><Mail size={12}/> {userMetadata.email}</p>
                <div className={`p-3 border rounded-sm flex justify-between items-center ${realizedPnL >= 0 ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500" : "border-red-500/20 bg-red-500/5 text-red-500"}`}>
                   <span className="text-[9px] font-black uppercase opacity-60">Session PnL</span>
                   <span className="text-xs font-black">${realizedPnL.toLocaleString()}</span>
                </div>
            </div>

            <div className={`p-6 border rounded-sm ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Spot Balance (USDT)</p>
                <h2 className="text-3xl font-mono font-bold tracking-tighter">${balances.spot.toLocaleString()}</h2>
                <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-sm overflow-hidden"><div className="h-full bg-emerald-500 w-[100%]" /></div>
            </div>

            <div className={`p-6 border rounded-sm ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Futures Balance (USDT)</p>
                <h2 className="text-3xl font-mono font-bold tracking-tighter">${balances.futures.toLocaleString()}</h2>
                <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-sm overflow-hidden"><div className="h-full bg-yellow-500 w-[100%]" /></div>
            </div>
        </div>

        {/* ACTIVE TRADES */}
        <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2">
                    <Activity size={12} className="text-emerald-500 animate-pulse" /> Live Positions
                </h3>
                
                <div className="relative">
                    <button 
                      onClick={() => { setShowNotifDropdown(!showNotifDropdown); if(!showNotifDropdown) markAllAsRead(); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all ${isDark ? "bg-black border-white/10 hover:bg-white/5" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                    >
                      <Bell size={14} className={unreadCount > 0 ? "text-yellow-500 animate-pulse" : "opacity-30"} />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Alerts</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[8px] font-black px-1 rounded-sm ml-1">{unreadCount}</span>
                      )}
                    </button>

                    {showNotifDropdown && (
                      <div className={`absolute right-0 mt-2 w-80 border rounded-sm shadow-2xl z-[1001] overflow-hidden ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200"}`}>
                        <div className="p-3 border-b border-inherit flex justify-between items-center bg-black/20">
                          <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Alert Ledger</span>
                          <CheckCircle2 size={12} className="opacity-30" />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center opacity-30 text-[10px] uppercase font-bold">No active alerts</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className={`p-4 border-b border-inherit last:border-0 ${!n.read ? (isDark ? 'bg-yellow-500/5' : 'bg-yellow-50') : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`text-[10px] font-black uppercase ${n.type === 'BUY' ? 'text-emerald-500' : n.type === 'SELL' ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {n.title}
                                  </span>
                                  <span className="text-[8px] opacity-30 font-mono">{new Date(n.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[11px] opacity-70 leading-relaxed font-sans">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                </div>
            </div>

            <div className={`rounded-sm border overflow-hidden ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                <table className="w-full text-[11px] font-mono text-left">
                    <thead className={`${isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"} uppercase text-[9px] font-bold`}>
                        <tr>
                            <th className="p-4">Asset</th><th className="p-4">Entry</th><th className="p-4">Mark</th><th className="p-4">PnL (%)</th><th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {activePositions.map(pos => {
                            const mark = livePrices[pos.symbol] || pos.price;
                            const pnl = calculatePnL(pos, mark);
                            return (
                                <tr key={pos.id} className={isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}>
                                    <td className="p-4 font-black uppercase">{pos.symbol} <span className="text-[8px] border px-1 ml-2 opacity-50">{pos.type}</span></td>
                                    <td className="p-4 opacity-60">${pos.price.toLocaleString()}</td>
                                    <td className="p-4 text-yellow-500 font-bold">${mark.toFixed(2)}</td>
                                    <td className={`p-4 font-black ${pnl.isPos ? 'text-emerald-500' : 'text-red-500'}`}>${pnl.val} ({pnl.percent}%)</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { setSellModal({ open: true, pos }); setSellAmountInput(pos.amount.toString()); }} className="bg-red-500 text-white px-4 py-1.5 rounded-sm text-[9px] font-black uppercase hover:bg-red-600 transition-all">Settle</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        <Features isDashboard={true} onTrade={(s, p) => setTradeModal({ open: true, coin: { symbol: s, price: p }, wallet: 'SPOT', side: 'LONG' })} />

        {/* LEDGER */}
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Market Ledger</h3>
                <div className="flex gap-2">
                    <button onClick={handleAccountReset} className="flex items-center gap-2 text-[9px] font-black border border-red-500 text-red-500 px-4 py-1.5 rounded-sm hover:bg-red-500 hover:text-white transition-all uppercase">
                        <RefreshCw size={12} /> Reset Account
                    </button>
                    <button onClick={downloadPDF} className="flex items-center gap-2 text-[9px] font-black border border-emerald-500 text-emerald-500 px-4 py-1.5 rounded-sm hover:bg-emerald-500 hover:text-black transition-all uppercase">
                        <Download size={12} /> PDF Report
                    </button>
                </div>
            </div>
            <div className={`rounded-sm border overflow-hidden ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
                <table className="w-full text-[11px] font-mono text-left">
                    <thead className={`${isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"} uppercase text-[8px] font-bold`}>
                      <tr><th className="p-4">Entry Time</th><th className="p-4">Exit Time</th><th className="p-4">Asset</th><th className="p-4">Entry → Exit</th><th className="p-4 text-right">PnL (%)</th></tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {currentTrades.map(t => {
                            const pnl = calculatePnL(t);
                            return (
                                <tr key={t.id} className="opacity-80">
                                    <td className="p-4 text-[9px] opacity-40 uppercase">{new Date(t.created_at).toLocaleString()}</td>
                                    <td className="p-4 text-[9px] text-emerald-500 uppercase">{new Date(t.closed_at).toLocaleString()}</td>
                                    <td className="p-4 font-black uppercase">{t.symbol}</td>
                                    <td className="p-4 opacity-40 font-bold">${t.price.toFixed(2)} → ${t.exit_price?.toFixed(2)}</td>
                                    <td className={`p-4 text-right font-black ${pnl.isPos ? 'text-emerald-500' : 'text-red-500'}`}>${pnl.val} ({pnl.percent}%)</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      {/* BUY MODAL */}
      {tradeModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
           <div className={`w-full max-w-sm p-6 rounded-sm border ${isDark ? "bg-[#0a0a0a] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-sm"><ArrowRightLeft size={16} className="text-yellow-500"/></div>
                  <h4 className="font-black uppercase text-xs">Link {tradeModal.coin?.symbol}</h4>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setAmountInput("")} className="opacity-40 hover:opacity-100"><RotateCcw size={14}/></button>
                    <X size={20} className="cursor-pointer opacity-30" onClick={() => setTradeModal({ ...tradeModal, open: false })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-4">
                 {['SPOT', 'FUTURES'].map(w => (
                   <button key={w} onClick={() => setTradeModal({...tradeModal, wallet: w})} className={`py-2 text-[10px] font-black uppercase rounded-sm border ${tradeModal.wallet === w ? 'bg-white text-black' : 'opacity-30 border-white/10'}`}>{w}</button>
                 ))}
              </div>
              <div className="space-y-6">
                <input type="number" value={amountInput} onChange={e => setAmountInput(e.target.value)} placeholder="0.00 QTY" className="w-full bg-transparent border-b border-white/10 py-3 text-4xl font-mono outline-none" autoFocus />
                <div className="p-4 bg-white/5 rounded-sm border border-white/5 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40"><span>Price</span><span>${tradeModal.coin?.price}</span></div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-yellow-500 border-t border-white/5 pt-2"><span>Total Cost</span><span>${((parseFloat(amountInput) || 0) * (tradeModal.coin?.price || 0)).toFixed(2)} USDT</span></div>
                </div>
                <button onClick={executeBuy} className="w-full bg-yellow-500 py-4 rounded-sm font-black text-black uppercase text-[11px] hover:bg-yellow-400 transition-all">Execute Order</button>
              </div>
           </div>
        </div>
      )}

      {/* SELL MODAL */}
      {sellModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <div className={`w-full max-w-sm p-6 rounded-sm border ${isDark ? "bg-[#0a0a0a] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h4 className="font-black uppercase text-xs">Settle: {sellModal.pos?.symbol}</h4>
                    <X size={18} className="cursor-pointer opacity-40" onClick={() => setSellModal({ open: false })} />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between text-[10px] p-3 bg-white/5 border border-white/5 font-black uppercase"><span className="opacity-40">Max</span><span className="text-yellow-500">{sellModal.pos?.amount}</span></div>
                    <input type="number" value={sellAmountInput} onChange={e => setSellAmountInput(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-3 text-3xl font-mono outline-none" />
                    <div className="grid grid-cols-4 gap-1">
                        {[25, 50, 75, 100].map(pct => (
                            <button key={pct} onClick={() => setSellAmountInput((sellModal.pos?.amount * (pct/100)).toString())} className="py-1.5 text-[8px] font-black bg-white/5 border border-white/5 hover:border-red-500 transition-colors">{pct}%</button>
                        ))}
                    </div>
                    <button onClick={executePartialSell} className="w-full bg-red-500 py-4 rounded-sm font-black text-white uppercase text-[11px] hover:bg-red-600 transition-all">Confirm Settle</button>
                </div>
            </div>
        </div>
      )}

      <Footer />
    </div>
  );
}