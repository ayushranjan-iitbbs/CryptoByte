"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/store/useThemeStore.js";
import { Sun, Moon, User, LayoutDashboard, Menu, X } from "lucide-react";
import { Roboto, Playwrite_DK_Uloopet } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });
const playwrite = Playwrite_DK_Uloopet({ weight: "400", subsets: ["latin"] });

export default function Navbar() {
  const { isDark, toggleTheme } = useThemeStore();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Mobile menu state
  
  const cryptoGreen = "#16C784";

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

  // Reusable Nav Link Component for consistent hover effects
  const NavLink = ({ href, children, icon: Icon }) => (
    <Link href={href} onClick={() => setIsOpen(false)} className="relative group py-1 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-emerald-500 md:hidden lg:block" />}
      <span className="transition-colors hover:text-emerald-500">{children}</span>
      <span 
        style={{ backgroundColor: cryptoGreen }} 
        className="absolute bottom-0 left-0 w-0 h-[1.5px] transition-all duration-300 group-hover:w-full" 
      />
    </Link>
  );

  return (
    <nav className={`fixed top-0 w-full z-50 transition-colors duration-700 border-b ${roboto.className} ${
      isDark ? "bg-[#050505]/80 border-white/5 text-white" : "bg-slate-50/80 border-black/5 text-black"
    } backdrop-blur-xl px-6 md:px-8 py-4 flex justify-between items-center`}>
      
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>
      </div>
      
       
      <Link href="/" className="relative z-50 group">
        <motion.h1 whileHover={{ scale: 1.02 }} className={`${playwrite.className} text-xl md:text-2xl tracking-tight`}>
          <span style={{ color: cryptoGreen }}>Crypto</span>
          <span className="font-light opacity-90">Byte</span>
        </motion.h1>
      </Link>

      
      <div className="relative z-10 hidden md:flex items-center gap-8 text-[11px] uppercase font-bold tracking-widest">
        <NavLink href="/ai-insights">AI Trading</NavLink>
        
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.button 
              key="login"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => router.push("/auth")}
              style={{ borderColor: cryptoGreen }} 
              className="border-[1.5px] px-6 py-2 rounded-sm font-black hover:bg-[#16C7841a] transition-all"
            >
              Login
            </motion.button>
          ) : (
            <div className="flex items-center gap-8 border-l border-white/10 pl-8">
              <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink href="/profile" icon={User}>Profile</NavLink>
            </div>
          )}
        </AnimatePresence>

        <button onClick={toggleTheme} className="p-2 rounded-sm border transition-all hover:scale-110">
          {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
        </button>
      </div>

       
      <div className="flex items-center gap-4 md:hidden relative z-50">
        <button onClick={toggleTheme} className="p-2">
          {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
        </button>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-full left-0 w-full p-8 border-b flex flex-col gap-6 text-[12px] uppercase font-bold tracking-[0.2em] shadow-2xl md:hidden ${
              isDark ? "bg-[#050505] border-white/5" : "bg-white border-black/5"
            }`}
          >
            <NavLink href="/ai-insights">AI Trading</NavLink>
            
            {user ? (
              <>
                <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/profile" icon={User}>Profile</NavLink>
              </>
            ) : (
              <button 
                onClick={() => { router.push("/auth"); setIsOpen(false); }}
                className="w-full py-4 border text-center"
                style={{ borderColor: cryptoGreen, color: cryptoGreen }}
              >
                Login to Platform
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}