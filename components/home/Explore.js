"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useThemeStore } from "@/store/useThemeStore.js";
import { ArrowUpRight, BrainCircuit, PieChart, Activity, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Explore() {
  const { isDark } = useThemeStore();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();
  }, []);

   
  const handleProtectedNavigation = (route) => {
    if (user) {
      router.push(route);
    } else {
      router.push("/auth");
    }
  };

  const cards = [
    {
      title: "Social Sentiment Engine",
      desc: "Aggregates millions of data points from X, Discord, and Reddit to predict price momentum before it happens.",
      icon: <BrainCircuit size={24} className="text-emerald-500" />,
      tag: "AI Analysis",
      route: "/ai-insights"
    },
    {
      title: "Smart Rebalancing",
      desc: "Automated portfolio adjustments based on your risk tolerance and real-time market volatility indexes.",
      icon: <PieChart size={24} className="text-blue-500" />,
      tag: "Automation",
      route: "/dashboard"
    },
    {
      title: "On-Chain Vigilance",
      desc: "Instant alerts on dormant 'Satoshi-era' wallet movements and exchange inflow spikes across 12 chains.",
      icon: <Activity size={24} className="text-orange-500" />,
      tag: "Live Data",
      route: "/dashboard"
    }
  ];

  return (
    <section className={`relative py-24 px-8 overflow-hidden transition-colors duration-700 ${isDark ? "bg-[#050505]" : "bg-white"}`}>
      
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] 
          ${isDark 
            ? "[mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]" 
            : "[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"}`} 
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <Fingerprint size={16} className="text-emerald-500" />
              <h2 className={`text-xs font-bold tracking-[0.4em] uppercase ${isDark ? "text-emerald-500/80" : "text-emerald-600"}`}>
                Advanced Ecosystem
              </h2>
            </motion.div>
            <h3 className={`text-4xl md:text-5xl font-black tracking-tighter leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              The Intelligence Layer <br/> <span className="opacity-40">of the New Economy.</span>
            </h3>
          </div>
          
          <button 
            onClick={() => handleProtectedNavigation("/dashboard")}
            className={`group flex items-center gap-3 px-8 py-4 rounded-xl border text-sm font-bold transition-all
            ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-2xl" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900"}`}>
            Explore All Tools
            <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </div>

         
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`group relative p-10 rounded-l border flex flex-col justify-between h-[360px] transition-all duration-300 overflow-hidden cursor-pointer
                ${isDark 
                  ? "bg-[#0A0A0A]/60 border-white/5 hover:border-emerald-500/40" 
                  : "bg-white border-slate-200 hover:border-emerald-500/40 hover:shadow-2xl"
                } backdrop-blur-md`}
              onClick={() => handleProtectedNavigation(card.route)}
            >
              
              <div className="space-y-6 relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center   
                  ${isDark ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-100"}`}>
                  {card.icon}
                </div>
                
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 px-2.5 py-1 rounded-full bg-emerald-500/10 inline-block">
                    {card.tag}
                  </span>
                  <h4 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {card.title}
                  </h4>
                  <p className={`text-sm leading-relaxed font-medium transition-opacity ${isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-600"}`}>
                    {card.desc}
                  </p>
                </div>
              </div>

               
              <div className="relative z-10 mt-8 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-emerald-500">
                <span>{user ? "Launch Tool" : "Unlock Access"}</span>
                <div className="h-[2px] w-8 bg-emerald-500 transition-all duration-500 group-hover:w-16" />
              </div>

               
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}