"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Roboto } from "next/font/google";
import { supabase } from "@/lib/supabase";  
import { useThemeStore } from "@/store/useThemeStore.js";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export default function Hero() {
  const containerRef = useRef(null);
  const router = useRouter();
  const { isDark } = useThemeStore();
  const [user, setUser] = useState(null);
  
  // Auth state listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const cryptoGreen = "#16C784";
  const cryptoRed = "#EA3943";

  return (
    <section 
      ref={containerRef}
      className={`relative h-screen min-h-[750px] flex items-center justify-center overflow-hidden transition-colors duration-700 
      ${isDark ? "bg-[#050505] text-white" : "bg-slate-50 text-slate-900"} ${roboto.className}`}
    >
      
       
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none brightness-100 contrast-150" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        <motion.div
          style={{ y: y1, backgroundColor: cryptoGreen }}
          animate={{ scale: [1, 1.1, 1], opacity: isDark ? [0.08, 0.12, 0.08] : [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[5%] w-[50%] h-[50%] rounded-full blur-[120px]"
        />
        
        <motion.div
          style={{ y: y2, backgroundColor: cryptoRed }}
          animate={{ scale: [1.1, 1, 1.1], opacity: isDark ? [0.05, 0.08, 0.05] : [0.08, 0.12, 0.08] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full blur-[120px]"
        />

        <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] 
          bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]`} />
      </div>

      
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 mb-10 rounded-full border text-[11px] font-bold tracking-widest uppercase
            ${isDark ? "bg-white/5 border-white/10 text-emerald-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Intelligence Engine v3.0
        </motion.div>

        <div className="mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter"
          >
            Predict the <span style={{ color: cryptoGreen }}>Momentum</span><br /> 
            Prevail the <span style={{ color: cryptoRed }}>Market</span>
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className={`max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed mb-10
            ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Harness neural-network models to decode 24/7 crypto volatility. <br className="hidden md:block"/>
          Capture non-linear Alpha before the retail market even spots the trend.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
           
          <button 
            onClick={() => !user ? router.push("/auth") : router.push("/dashboard")}
            className="w-full sm:w-auto px-8 py-4 rounded-md bg-[#16C784] text-white font-black uppercase tracking-widest text-[11px] hover:shadow-[0_0_25px_rgba(22,199,132,0.4)] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            {!user ? "Start Trading" : "Buy Trade"}
          </button>

        
          <button 
            onClick={() => !user ? router.push("/ai-insights") : router.push("/ai-trading")}
            className={`w-full sm:w-auto px-8 py-4 rounded-md border font-black uppercase tracking-widest text-[11px] transition-all
              ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10 text-white" : "border-slate-300 bg-white hover:bg-slate-50 text-slate-900"}`}
          >
            {!user ? "View Live Signals" : "AI Based Trading"}
          </button>
        </motion.div>
      </div>
    </section>
  );
}