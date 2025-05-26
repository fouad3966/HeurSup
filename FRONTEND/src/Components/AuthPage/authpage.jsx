import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BG1 from "../../assets/AuthPage_assets/BG1.png";
import logo from "../../assets/AuthPage_assets/logo.png";
import "./authpage.css";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/admin/login", {
        email,
        motDePasse: password,
      });

      const { token } = response.data;

      // ✅ Save token in localStorage
      localStorage.setItem("token", token);

      // ✅ Redirect after successful login
      navigate("/Prof");
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur de connexion au serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>
        <h2>
          Bienvenue! <br /> veuillez vous connecter pour commencer.
        </h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="actions-container">
            <a href="/forgot-password" className="forgot-password">
              Mot de passe oublié?
            </a>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Connexion..." : "Connexion"}
            </button>
          </div>
        </form>
      </div>

      <div className="info-section">
        <img src={BG1} alt="Background" className="info-bg" />
        <div className="info-content">
          <h3>Gestion des heures supplémentaires</h3>
          <p>
            Notre plateforme offre un moyen efficace de calculer les heures
            supplémentaires d'enseignement, garantissant transparence et
            précision.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
