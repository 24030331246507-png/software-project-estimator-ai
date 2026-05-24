import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Loading from "./components/Loading.jsx";

const Home = React.lazy(() => import("./pages/Home.jsx"));
const Prediction = React.lazy(() => import("./pages/Prediction.jsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.jsx"));
const About = React.lazy(() => import("./pages/About.jsx"));
const Contact = React.lazy(() => import("./pages/Contact.jsx"));
const Login = React.lazy(() => import("./pages/Login.jsx"));
const Register = React.lazy(() => import("./pages/Register.jsx"));
const Admin = React.lazy(() => import("./pages/Admin.jsx"));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page narrow">
          <div className="panel prose">
            <h1>App could not load</h1>
            <p>{this.state.error.message}</p>
            <button className="btn" type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Protected({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <Navbar />
        <main>
          <Suspense fallback={<Loading label="Loading Project Analysis" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/predict" element={<Protected><Prediction /></Protected>} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/admin" element={<Protected><Admin /></Protected>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
