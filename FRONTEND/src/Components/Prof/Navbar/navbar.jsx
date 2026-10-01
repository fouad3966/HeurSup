"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/api";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import "./navbar.css";
import logo from "../../../assets/AuthPage_assets/logowhite.png";
import ProfilePicture from "../../../assets/ProfPage_assets/ProfilePicture.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathToTabIndex = {
    "/Prof": 0,
    "/Planning": 1,
    "/Rapport": 2,
  };

  const getCurrentTabIndex = () => {
    const matchingPath = Object.keys(pathToTabIndex).find((path) =>
      location.pathname.startsWith(path)
    );
    return matchingPath ? pathToTabIndex[matchingPath] : 0;
  };

  const [value, setValue] = useState(getCurrentTabIndex());
  const [userInfo, setUserInfo] = useState({
    username: "Admin",
    role: "Administrateur",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      const cachedAdminData = localStorage.getItem("adminData");

      if (cachedAdminData) {
        try {
          const parsedData = JSON.parse(cachedAdminData);
          const now = new Date().getTime();
          if (parsedData.expiry && parsedData.expiry > now) {
            setUserInfo({
              username: parsedData.nomComplet,
              role: "Administrateur",
            });
            setLoading(false);
            return;
          } else {
            localStorage.removeItem("adminData");
          }
        } catch {
          localStorage.removeItem("adminData");
        }
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const adminId = payload.id || payload.userId || payload.adminId;

        if (!adminId) {
          setLoading(false);
          return;
        }

        const response = await api.get(`/admin/${adminId}`);
        const adminData = {
          ...response.data,
          expiry: new Date().getTime() + 24 * 60 * 60 * 1000,
        };
        localStorage.setItem("adminData", JSON.stringify(adminData));

        setUserInfo({
          username: response.data.nomComplet,
          role: "Administrateur",
        });
      } catch {
        // Silently fail — use default
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  useEffect(() => {
    setValue(getCurrentTabIndex());
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    const path = Object.keys(pathToTabIndex).find(
      (key) => pathToTabIndex[key] === newValue
    );
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  const navItems = [
    { label: "Enseignants", path: "/Prof" },
    { label: "Planning", path: "/Planning" },
    { label: "Rapports", path: "/Rapport" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={logo}
          alt="HeurSup"
          className="navbar-logo"
          onClick={() => navigate("/Prof")}
        />
      </div>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Navigation principale"
          variant="standard"
          TabIndicatorProps={{
            style: {
              background: 'white',
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          {navItems.map((item, index) => (
            <Tab
              key={item.path}
              label={item.label}
              disableRipple
              sx={{
                color: 'rgba(255,255,255,0.7) !important',
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                textTransform: 'none',
                padding: '6px 20px',
                minWidth: 'unset',
                minHeight: '68px',
                letterSpacing: '0.01em',
                transition: 'all 150ms',
                '&.Mui-selected': {
                  color: 'white !important',
                  fontWeight: 600,
                },
                '&:hover': {
                  color: 'white !important',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '10px 10px 0 0',
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      <div className="navbar-right">
        <div className="user-info">
          <span className="user-name">
            {loading ? "..." : userInfo.username}
          </span>
          <span className="user-role">{userInfo.role}</span>
        </div>
        <div className="profile-container">
          <img
            src={ProfilePicture}
            alt="Profil"
            className="profile-picture"
          />
          <div className="profile-dropdown">
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
