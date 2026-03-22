"use client";
import { motion } from "framer-motion";

export default function FluidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-900/30"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          x: [0, -80, 0],
          y: [0, -100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-purple-900/20"
      />
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none contrast-150 brightness-100 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}