import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AuthPage from "./Components/AuthPage/authpage";
import Navbar from "./Components/Prof/Navbar/navbar";
import BodyP1 from "./Components/Prof/Body/bodyP1";
import Profile from "./Components/Profile/profile";
import Planning from "./Components/Planning/planning";
import Rapport from "./Components/Rapport/Rapport";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/Prof"
          element={
            <div className="container">
              <Navbar />
              <BodyP1 />
            </div>
          }
        />
        <Route path="/Planning" element={<Planning />} />
        <Route path="/Rapport" element={<Rapport />} />

        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
