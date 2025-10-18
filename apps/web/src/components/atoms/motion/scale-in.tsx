"use client";
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function ScaleIn({ children, delay = 0, duration = 0.2, scale = 0.95 }: { children: React.ReactNode; delay?: number; duration?: number; scale?: number }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0, scale }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration }}>
      {children}
    </motion.div>
  );
}
