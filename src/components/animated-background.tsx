"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDarkMode = theme === "dark";

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        className="absolute top-0 left-1/6 w-[500px] h-[500px] rounded-full opacity-80 dark:opacity-80"
        style={{
          background: isDarkMode
            ? "radial-gradient(circle, #48c6ef 0%, transparent 70%)"
            : "radial-gradient(circle, #6f86d6 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="absolute bottom-0 right-1/6 w-[400px] h-[400px] rounded-full opacity-80 dark:opacity-80"
        style={{
          background: isDarkMode
            ? "radial-gradient(circle, #9795f0 0%, transparent 70%)"
            : "radial-gradient(circle, #9be15d 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 40, -30, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full opacity-30 dark:opacity-25"
        style={{
          background: isDarkMode
            ? "radial-gradient(circle, #984ddf 0%, transparent 70%)"
            : "radial-gradient(circle, #74d9e1 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -20, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, ${
            isDarkMode ? "#fff" : "#000"
          } 1px, transparent 1px), 
                            linear-gradient(to bottom, ${
                              isDarkMode ? "#fff" : "#000"
                            } 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
};
