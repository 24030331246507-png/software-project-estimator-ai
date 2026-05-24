import React from "react";
import { AlertTriangle, BarChart3, Brain, ClipboardList, Gauge, ShieldCheck, Users } from "lucide-react";

export default function Sidebar({ active = "Predictions", onChange = () => {} }) {
  const items = [
    ["Predictions", ClipboardList],
    ["Task Ownership", Users],
    ["Team Profiles", Users],
    ["Variance Tracker", Gauge],
    ["Problem Center", AlertTriangle],
    ["Risk Analytics", ShieldCheck],
    ["Model Metrics", Brain],
    ["Portfolio Trends", BarChart3],
  ];
  return (
    <aside className="sidebar">
      {items.map(([label, Icon]) => (
        <button
          key={label}
          className={active === label ? "side-item active" : "side-item"}
          onClick={() => onChange(label)}
          type="button"
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </aside>
  );
}
