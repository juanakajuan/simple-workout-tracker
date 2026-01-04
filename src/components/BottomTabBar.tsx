import { useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutTemplate, CirclePlay, History, CircleEllipsis } from "lucide-react";

import "./BottomTabBar.css";

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Track last visited sub-route for each section
  const lastTemplatesPath = useRef("/templates");
  const lastMorePath = useRef("/more");

  // Update refs when location changes (doesn't trigger re-renders)
  useEffect(() => {
    if (location.pathname.startsWith("/templates")) {
      lastTemplatesPath.current = location.pathname;
    } else if (location.pathname.startsWith("/more")) {
      lastMorePath.current = location.pathname;
    }
  }, [location.pathname]);

  const isTemplatesActive = location.pathname.startsWith("/templates");
  const isMoreActive = location.pathname.startsWith("/more");

  const handleTabClick = (
    e: React.MouseEvent,
    basePath: string,
    lastPath: string,
    isActive: boolean
  ) => {
    e.preventDefault();

    if (isActive) {
      // If already on this tab, scroll to top and navigate to root
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (location.pathname !== basePath) {
        navigate(basePath);
      }
    } else {
      // Navigate to last visited sub-route
      navigate(lastPath);
    }
  };

  const handleSimpleTabClick = (e: React.MouseEvent, isActive: boolean) => {
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="bottom-tab-bar">
      <NavLink
        to="/exercises"
        className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        onClick={(e) => handleSimpleTabClick(e, location.pathname === "/exercises")}
      >
        <Dumbbell size={24} />
        <span>Exercises</span>
      </NavLink>

      <NavLink
        to={lastTemplatesPath.current}
        className={`tab ${isTemplatesActive ? "active" : ""}`}
        onClick={(e) =>
          handleTabClick(e, "/templates", lastTemplatesPath.current, isTemplatesActive)
        }
      >
        <LayoutTemplate size={24} />
        <span>Templates</span>
      </NavLink>

      <NavLink
        to="/workout"
        className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        onClick={(e) => handleSimpleTabClick(e, location.pathname === "/workout")}
      >
        <CirclePlay size={24} />
        <span>Workout</span>
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        onClick={(e) => handleSimpleTabClick(e, location.pathname === "/history")}
      >
        <History size={24} />
        <span>History</span>
      </NavLink>

      <NavLink
        to={lastMorePath.current}
        className={`tab ${isMoreActive ? "active" : ""}`}
        onClick={(e) => handleTabClick(e, "/more", lastMorePath.current, isMoreActive)}
      >
        <CircleEllipsis size={24} />
        <span>More</span>
      </NavLink>
    </nav>
  );
}
