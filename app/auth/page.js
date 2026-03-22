"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore.js";
import { supabase } from "@/lib/supabase";

import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

export default function AuthPage() {
  const { isDark } = useThemeStore();
  const router = useRouter();

  // States
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); 
    setOtp(newOtp);
    if (value !== "" && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  
  const handleStartAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        shouldCreateUser: true,  
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep(2);
      setTimer(60);
    }
    setLoading(false);
  };

   
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const otpCode = otp.join("");

    // 1. Verify the OTP with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otpCode,
      type: 'email',
    });

    if (authError) {
      setErrorMsg("Verification failed: " + authError.message);
      setLoading(false);
      return;
    }

    if (authData?.user) {
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,  
          full_name: formData.fullName,
          phone_number: formData.phone,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Database sync failed:", profileError.message);
         
      }

      
      router.push("/");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Styles
  const inputClasses = `w-full px-4 py-3 rounded-sm border text-sm outline-none transition-all font-mono ${
    isDark ? "bg-white/5 border-white/10 focus:border-emerald-500 text-white" : "bg-gray-100 border-black/10 focus:border-emerald-500 text-black"
  }`;
  const labelClasses = "text-[10px] font-bold uppercase opacity-50 tracking-widest ml-1";

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${isDark ? "bg-[#080808] text-white" : "bg-gray-50 text-black"}`}>
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6 py-20">
        <div className={`w-full max-w-md p-8 rounded-sm border ${isDark ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/5 shadow-2xl"}`}>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              <span className="text-emerald-500">CRYPTO</span>BYTE
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mt-2">
              {step === 1 ? "Terminal Registration" : "Identity Verification"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold uppercase text-center rounded-sm">
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStartAuth} className="space-y-4">
              <div className="space-y-1">
                <label className={labelClasses}>Full Name</label>
                <input name="fullName" type="text" required placeholder="EX: SATOSHI NAKAMOTO" className={inputClasses} value={formData.fullName} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Mobile Connection</label>
                <input name="phone" type="tel" required placeholder="+91 XXXXX XXXXX" className={inputClasses} value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Auth Email</label>
                <input name="email" type="email" required placeholder="USER@TERMINAL.COM" className={inputClasses} value={formData.email} onChange={handleInputChange} />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase py-4 mt-4 rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                {loading ? "Initializing..." : "Register Identity"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndSave} className="space-y-8">
              <div className="text-center">
                <p className="text-xs opacity-50 mb-6 font-mono">CODE SENT TO: <span className="text-emerald-500">{formData.email}</span></p>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input key={index} id={`otp-${index}`} type="text" maxLength="1" className={`w-11 h-14 text-center text-xl font-bold rounded-sm border outline-none ${isDark ? "bg-white/5 border-white/10 focus:border-emerald-500" : "bg-gray-100 border-black/10 focus:border-emerald-500"}`} value={digit} onChange={(e) => handleOtpChange(e.target.value, index)} onFocus={(e) => e.target.select()} />
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || otp.join("").length < 6} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase py-4 rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                {loading ? "Verifying..." : "Verify & Connect"}
              </button>

              <div className="text-center">
                <button onClick={() => setStep(1)} type="button" className="text-[9px] uppercase font-bold text-red-500/50 hover:text-red-500 transition-colors">
                  &larr; Re-enter Details
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 pt-6 border-t border-inherit text-center">
            <p className="text-[8px] uppercase tracking-[0.4em] opacity-20 font-bold italic">Node Security Active</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}