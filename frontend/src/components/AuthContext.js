import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("accessToken");
    return !!token;
  });

  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [className, setClassName] = useState(() => localStorage.getItem("className") || "");

  // Keep state in sync with localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "accessToken") setIsAuthenticated(!!e.newValue);
      if (e.key === "username") setUsername(e.newValue || "");
      if (e.key === "role") setRole(e.newValue || "");
      if (e.key === "className") setClassName(e.newValue || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (user, token, userRole, className) => {
    try {
      // Store in localStorage
      localStorage.setItem("accessToken", token);
      localStorage.setItem("username", user);
      localStorage.setItem("role", userRole);
      localStorage.setItem("className", className || "");

      // Update state
      setIsAuthenticated(true);
      setUsername(user);
      setRole(userRole);
      setClassName(className || "");
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error("Failed to store authentication data");
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("className");
      localStorage.removeItem("streakData");
      localStorage.removeItem("rewardData");
      localStorage.removeItem("completedChapters");
      localStorage.removeItem("lastRoute");

      // Reset state
      setIsAuthenticated(false);
      setUsername("");
      setRole("");
      setClassName("");

      
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, username, role, className, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
