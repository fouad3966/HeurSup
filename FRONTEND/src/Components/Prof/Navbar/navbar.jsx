"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import "./navbar.css";
import logo from "../../../assets/AuthPage_assets/logowhite.png";
import ProfilePicture from "../../../assets/ProfPage_assets/ProfilePicture.png";

const StyledTabs = styled(Tabs)({
  "& .MuiTabs-indicator": {
    backgroundColor: "white",
    height: "4px",
    borderRadius: "2px",
  },
  "& .MuiTabs-flexContainer": {
    gap: "20px",
  },
});

const StyledTab = styled(Tab)({
  color: "white",
  fontFamily: '"Poppins", sans-serif',
  fontSize: "16px",
  textTransform: "none",
  padding: "0 16px",
  minWidth: "unset",
  opacity: 0.8,
  transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  "&.Mui-selected": {
    fontWeight: "600",
    opacity: 1,
    color: "white !important",
  },
  "&:hover": {
    opacity: 1,
  },
});

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Map paths to tab indices
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
    role: "Admin",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch admin information when component mounts
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
              role: "Admin",
            });
            setLoading(false);
            return;
          } else {
            localStorage.removeItem("adminData");
          }
        } catch (err) {
          console.error("Error parsing cached admin data:", err);
          localStorage.removeItem("adminData");
        }
      }

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("Token not found, skipping admin info fetch");
          setLoading(false);
          return;
        }

        const api = axios.create({
          baseURL: "http://localhost:5000",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = JSON.parse(atob(token.split(".")[1]));
        const adminId = payload.id || payload.userId || payload.adminId;

        if (!adminId) {
          console.log("Admin ID not found in token");
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
          role: "Admin",
        });
      } catch (err) {
        console.error("Error fetching admin information:", err);
        setError("Failed to load admin information");
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
    { label: "Rapport", path: "/Rapport" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src={logo || "/placeholder.svg"}
          alt="Logo"
          className="navbar-logo"
        />
      </div>

      <Box
        sx={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <StyledTabs
          value={value}
          onChange={handleChange}
          aria-label="nav tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {navItems.map((item, index) => (
            <StyledTab
              key={item.path}
              label={item.label}
              aria-controls={`nav-tabpanel-${index}`}
              id={`nav-tab-${index}`}
              disableRipple
            />
          ))}
        </StyledTabs>
      </Box>

      <div className="navbar-right">
        <div className="user-info">
          <span className="user-name">
            {loading ? "Chargement..." : error ? "Admin" : userInfo.username}
          </span>
          <span className="user-role">{userInfo.role}</span>
        </div>
        <div className="profile-container">
          <img
            src={ProfilePicture || "/placeholder.svg"}
            alt="User"
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
