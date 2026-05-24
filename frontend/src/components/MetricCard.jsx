import React from "react";
import { motion } from "framer-motion";

export default function MetricCard({ title, value, accent, children }) {
  return (
    <motion.section className="metric-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <div className="metric-accent" style={{ background: accent }} />
      <p>{title}</p>
      <h3>{value}</h3>
      {children}
    </motion.section>
  );
}
