import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, CalendarClock, ClipboardCheck, DollarSign, ShieldAlert, Users } from "lucide-react";
import dashboardImage from "../assets/hero-dashboard.svg";
import ganttImage from "../assets/hero-gantt.svg";
import reportImage from "../assets/hero-report.svg";

const solutionCards = [
  {
    title: "Cost Overrun Control",
    problem: "Budget increases because scope, integrations and vendor rates change during execution.",
    solution: "The system compares cost drivers, reuse percentage, material index and volatility, then suggests a safer plan before approval.",
  },
  {
    title: "Schedule Delay Prevention",
    problem: "Teams discover critical-path delays late, after testing or deployment is already blocked.",
    solution: "PERT and CPM expose early start, late finish, slack and critical tasks so managers can act before the deadline slips.",
  },
  {
    title: "Team Accountability",
    problem: "Final ownership is unclear when multiple developers, testers and analysts work on one project.",
    solution: "Task ownership, status, progress and profile views show who is doing what and where work is blocked.",
  },
];

export default function Home() {
  return (
    <div className="page">
      <section className="hero">
        <motion.div className="hero-content" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="animated-title">
            <span>Cost & Time</span>
            <span className="title-line">Project Analysis</span>
          </h1>
          <p className="hero-copy">Predict software cost, delivery timeline, risk level, success probability and optimal team size using Random Forest, MLP analysis, PERT, CPM and interactive Gantt planning.</p>
          <div className="hero-actions">
            <Link className="btn" to="/predict">Start Prediction</Link>
            <Link className="btn ghost" to="/about">View Methodology</Link>
          </div>
        </motion.div>
        <div className="hero-visual-stage" aria-label="Project analysis visual preview">
          <motion.img className="hero-visual-card visual-one" src={dashboardImage} alt="Project dashboard preview" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} />
          <motion.img className="hero-visual-card visual-two" src={ganttImage} alt="Gantt planning preview" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} />
          <motion.img className="hero-visual-card visual-three" src={reportImage} alt="Project report preview" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} />
        </div>
      </section>

      <section className="solution-lab">
        <div className="section-title">
          <p className="eyebrow">Major project scope</p>
          <h1>Real-Time Project Problem Solver</h1>
          <p>
            Built for real software project planning: predict effort, identify project risk,
            expose critical tasks, assign work, track history and generate reports for review.
          </p>
        </div>
        <div className="solution-grid">
          {solutionCards.map((card, index) => (
            <motion.div
              className="panel solution-card"
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              {index === 0 && <DollarSign size={28} />}
              {index === 1 && <CalendarClock size={28} />}
              {index === 2 && <ClipboardCheck size={28} />}
              <h2>{card.title}</h2>
              <p><strong>Problem:</strong> {card.problem}</p>
              <p><strong>Solution:</strong> {card.solution}</p>
            </motion.div>
          ))}
        </div>
        <div className="solution-strip">
          <span><ShieldAlert size={18} /> Problem Center</span>
          <span><Activity size={18} /> Delay Simulation</span>
          <span><Users size={18} /> Team Profiles</span>
          <span><ClipboardCheck size={18} /> PDF Report</span>
        </div>
      </section>
    </div>
  );
}
