import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../services/api.js";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(new URLSearchParams(window.location.search).get("expired") ? "Session expired. Please login again." : "");
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await auth.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not connect to backend. Restart Flask and try again.");
    }
  };
  return (
    <div className="auth-page">
      <form className="panel auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <input placeholder="Email, e.g. vaishu@example.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">Login</button>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
