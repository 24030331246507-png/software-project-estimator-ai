import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrainCircuit, ShieldCheck, UserRound } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const authed = Boolean(localStorage.getItem("token"));
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = storedUser?.role === "admin";
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">
        <BrainCircuit size={26} />
        <span>Cost & Time Project Analysis</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/">Home</NavLink>
        {authed && <NavLink to="/predict">Prediction</NavLink>}
        {authed && <NavLink to="/dashboard">Dashboard</NavLink>}
        {authed && <NavLink to="/admin">Admin</NavLink>}
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        {!authed ? (
          <NavLink className="btn small" to="/login">Login</NavLink>
        ) : (
          <button className={isAdmin ? "profile-logout admin" : "profile-logout"} onClick={logout} title="Click to logout" type="button">
            {isAdmin ? <ShieldCheck size={19} /> : <UserRound size={19} />}
            <span>{isAdmin ? "Admin" : storedUser?.name?.split(" ")[0] || "User"}</span>
            <small>Logout</small>
          </button>
        )}
      </div>
    </nav>
  );
}
