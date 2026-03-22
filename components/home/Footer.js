"use client";
import { useThemeStore } from "@/store/useThemeStore.js";
import { Github, Twitter, Linkedin, Mail, ExternalLink, ShieldCheck } from "lucide-react";
import { Roboto, Roboto_Mono } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Footer() {
  const { isDark } = useThemeStore();

  const footerLinks = [
    { 
      title: "Platform", 
      links: [
        { name: "Live Trades", href: "/dashboard" },
        { name: "AI Strategy", href: "/ai-insights" },
        { name: "Backtesting", href: "/dashboard" },
        { name: "Market Data", href: "/dashboard" }
      ] 
    },
    { 
      title: "Company", 
      links: [
        { name: "About Us", href: "#" },
        { name: "CryptoByte AI", href: "/" },
        { name: "Careers", href: "#" },
        { name: "Privacy Policy", href: "#" }
      ] 
    },
    { 
      title: "Resources", 
      links: [
        { name: "Documentation", href: "/dashboard" },
        { name: "Binance API", href: "https://www.binance.com/en-IN/binance-api" },
        { name: "LLM Guides", href: "/dashboard" },
        { name: "Support", href: "/dashboard" }
      ] 
    },
  ];

  return (
    <footer className={`relative border-t transition-colors duration-500 overflow-hidden ${roboto.className} ${
      isDark ? "bg-[#050505] border-white/10 text-white" : "bg-white border-black/10 text-black"
    }`}>
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] 
          [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)] opacity-60`} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-10">
          
          <div className="col-span-1 md:col-span-2 space-y-6">
            <h2 className="text-2xl font-black tracking-tighter text-emerald-500 flex items-center gap-2">
              <ShieldCheck size={28} /> CRYPTOBYTE
            </h2>
            <p className="text-sm opacity-50 leading-relaxed max-w-xs font-medium">
              The next generation of AI-powered trading intelligence. 
              Real-time insights and institutional infrastructure.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className={`p-2 rounded-lg border transition-all ${isDark ? "border-white/5 bg-white/5 hover:bg-emerald-500/10" : "border-black/5 bg-black/5 hover:bg-emerald-500/10"}`}>
                  <Icon size={18} className="hover:text-emerald-500" />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((group, idx) => (
            <div key={idx} className="col-span-1">
              <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] mb-6 opacity-40">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link, i) => (
                  <li key={i}>
                    <a href={link.href} className="group text-sm opacity-60 hover:opacity-100 hover:text-emerald-500 transition-all flex items-center gap-2 font-medium">
                      <span className="w-0 group-hover:w-2 h-[1px] bg-emerald-500 transition-all" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-1">
            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] mb-6 opacity-40">System Access</h3>
            <a 
              href="https://www.binance.com/en-IN/binance-api" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`block w-full py-3 text-center rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isDark ? "bg-white text-black hover:bg-emerald-500 hover:text-white" : "bg-black text-white hover:bg-emerald-500"
              }`}
            >
              GET API KEYS
            </a>
          </div>
        </div>

        <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 ${isDark ? "border-white/5" : "border-black/5"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest opacity-30 ${robotoMono.className}`}>
            © 2026 CRYPTOBYTE  
          </p>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEMS_ONLINE
            </span>
            <a href="#" className="opacity-40 hover:opacity-100 hover:text-emerald-500 transition-all flex items-center gap-1">
              NETWORK STATUS <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}