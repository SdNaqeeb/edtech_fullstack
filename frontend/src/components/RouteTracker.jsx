import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const ignoredRoutes = ["/", "/login", "/signup"];
    if (!ignoredRoutes.includes(location.pathname)) {
      localStorage.setItem("lastRoute", location.pathname);
    }
  }, [location]);

  return null;
};

export default RouteTracker;
