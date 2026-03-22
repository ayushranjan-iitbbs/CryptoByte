"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/store/useThemeStore.js";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

export default function ProfilePage() {
  const { isDark } = useThemeStore();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
       
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        
        router.push("/auth");
        return;
      }

     
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#080808]" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex py-20 flex-col min-h-screen ${isDark ? "bg-[#080808] text-white" : "bg-gray-50 text-black"}`}>
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6">
        <div className={`w-full max-w-2xl p-8 border rounded-sm ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/5 shadow-xl"}`}>
          
          <div className="flex items-center gap-6 mb-10 pb-6 border-b border-inherit">
            <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-black text-3xl font-black">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Terminal User Profile</h1>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.3em]">Access Level: Verified</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Full Name</p>
              <p className="font-mono text-lg">{profile?.full_name || "NOT SET"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Mobile Link</p>
              <p className="font-mono text-lg">{profile?.phone_number || "NOT SET"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Terminal ID (UUID)</p>
              <p className="font-mono text-[10px] opacity-60 break-all">{profile?.id}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Last Sync</p>
              <p className="font-mono text-xs">{new Date(profile?.updated_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-emerald-500 text-black font-black uppercase text-xs rounded-sm hover:bg-emerald-400 transition-all"
            >
              Return to Terminal
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/auth");
              }}
              className={`px-6 py-3 border font-black uppercase text-xs rounded-sm transition-all ${isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
            >
              Logout
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}