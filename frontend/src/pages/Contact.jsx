import React, { useState } from "react";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import { contact } from "../services/api.js";

const contacts = [
  {
    title: "Project Coordinator",
    name: "Cost & Time Project Analysis Team",
    detail: "For project demo, viva explanation, feature clarification and final submission queries.",
    icon: UserRound,
  },
  {
    title: "Technical Support",
    name: "Development Support Desk",
    detail: "For login, prediction, dashboard, report download, hosting and database setup issues.",
    icon: Phone,
  },
  {
    title: "Report & Documentation",
    name: "Project Documentation Help",
    detail: "For README, deployment guide, PPT flow, screenshots and project report content.",
    icon: Mail,
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", queryType: "", message: "" });
  const [status, setStatus] = useState("");
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const { data } = await contact.send(form);
      setStatus(data.message);
      setForm({ name: "", email: "", queryType: "", message: "" });
    } catch (err) {
      setStatus(err.response?.data?.message || "Message could not be saved.");
    }
  };

  return (
    <div className="page contact-page">
      <section className="section-title">
        <p className="eyebrow">Support and communication</p>
        <h1>Contact Project Team</h1>
        <p>
          Use this page to decide whom to contact for project demo, technical issue,
          hosting setup, report download or project documentation help.
        </p>
      </section>

      <section className="contact-grid">
        {contacts.map(({ title, name, detail, icon: Icon }) => (
          <div className="panel contact-card" key={title}>
            <Icon size={28} />
            <h2>{title}</h2>
            <strong>{name}</strong>
            <p>{detail}</p>
          </div>
        ))}
      </section>

      <section className="contact-layout">
        <div className="panel contact-info">
          <h2>When To Contact</h2>
          <div>
            <strong>Project owner</strong>
            <p>Contact for project access code, task progress updates and report review.</p>
          </div>
          <div>
            <strong>Technical support</strong>
            <p>Contact when backend is not running, prediction fails, PDF is not downloading or hosting API is not connected.</p>
          </div>
          <div>
            <strong>College guide / reviewer</strong>
            <p>Contact for requirement approval, viva feedback, documentation format and final submission checklist.</p>
          </div>
          <div className="contact-line"><Mail size={18} /> project.analysis@example.com</div>
          <div className="contact-line"><Phone size={18} /> +91 98765 43210</div>
          <div className="contact-line"><MapPin size={18} /> Project Analysis Lab</div>
        </div>

        <form className="panel contact-form" onSubmit={submit}>
          <h2>Send Project Query</h2>
          {status && <p className="notice">{status}</p>}
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
          <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email address" />
          <select value={form.queryType} onChange={(e) => update("queryType", e.target.value)}>
            <option value="" disabled>Select query type</option>
            <option>Project demo help</option>
            <option>Prediction issue</option>
            <option>Dashboard or progress tracking</option>
            <option>PDF report download</option>
            <option>Hosting and deployment</option>
            <option>Final submission documentation</option>
          </select>
          <textarea rows={6} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Write your project query" />
          <button className="btn" type="submit">Send Message</button>
          <p>Your message will be saved in the project database and visible to admin users.</p>
        </form>
      </section>
    </div>
  );
}
