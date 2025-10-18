"use client";
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function SlideUp({ children, delay = 0, duration = 0.25, distance = 12 }: { children: React.ReactNode; delay?: number; duration?: number; distance?: number }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0, y: distance }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration }}>
      {children}
    </motion.div>
  );
}
