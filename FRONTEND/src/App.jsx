import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./Components/Toast/Toast";
import ProtectedRoute from "./Components/ProtectedRoute";
import AuthPage from "./Components/AuthPage/authpage";
import Navbar from "./Components/Prof/Navbar/navbar";
import BodyP1 from "./Components/Prof/Body/bodyP1";
import Profile from "./Components/Profile/profile";
import Planning from "./Components/Planning/planning";
import Rapport from "./Components/Rapport/Rapport";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/Prof"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Navbar />
                  <BodyP1 />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/Planning"
            element={
              <ProtectedRoute>
                <Planning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Rapport"
            element={
              <ProtectedRoute>
                <Rapport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
