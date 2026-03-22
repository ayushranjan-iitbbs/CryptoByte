"use client";
import { useThemeStore } from "@/store/useThemeStore.js";
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Footer from "@/components/home/Footer";
 
import Explore from "@/components/home/Explore";

export default function Page() {
  const { isDark } = useThemeStore();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      <Navbar />
      
      <main>
        <Hero />
        <Features isDark={isDark} />
<Explore/>
      </main>

       <Footer/>
    </div>
  );
}