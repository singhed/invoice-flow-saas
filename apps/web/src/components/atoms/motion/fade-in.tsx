"use client";
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function FadeIn({ children, delay = 0, duration = 0.2 }: { children: React.ReactNode; delay?: number; duration?: number }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration }}>
      {children}
    </motion.div>
  );
}
