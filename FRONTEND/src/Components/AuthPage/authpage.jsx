import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import heroImg from "../../assets/AuthPage_assets/hero.jpg";
import logo from "../../assets/AuthPage_assets/logowhite.png";
import "./authpage.css";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/admin/login", {
        email,
        motDePasse: password,
      });

      const { token } = response.data;
      localStorage.setItem("token", token);
      navigate("/Prof");
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur de connexion au serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg-pattern">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      <div className="auth-container">
        {/* Left — Form */}
        <div className="auth-form-section">
          <div className="auth-form-inner">
            <div className="auth-logo">
              <img src={logo} alt="HeurSup" />
            </div>

            <div className="auth-heading">
              <h1>Bienvenue</h1>
              <p>Connectez-vous pour gérer les heures supplémentaires</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-field">
                <label htmlFor="email">Adresse email</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">Mot de passe</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Connexion...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </button>
            </form>

            <div className="auth-footer">
              <span>HeurSup © {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Right — Hero */}
        <div className="auth-hero-section">
          <img src={heroImg} alt="" className="auth-hero-img" />
          <div className="auth-hero-overlay">
            <div className="auth-hero-content">
              <h2>Gestion des heures supplémentaires</h2>
              <p>
                Une plateforme intelligente pour calculer, suivre et gérer les heures
                supplémentaires des enseignants avec précision et transparence.
              </p>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-number">500+</span>
                  <span className="hero-stat-label">Enseignants</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">12K+</span>
                  <span className="hero-stat-label">Heures gérées</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">99%</span>
                  <span className="hero-stat-label">Précision</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
