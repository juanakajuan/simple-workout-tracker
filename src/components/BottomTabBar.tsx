import { useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutTemplate, CirclePlay, History, CircleEllipsis } from "lucide-react";

import "./BottomTabBar.css";

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Track last visited sub-route for each section (using refs to avoid re-renders)
  const lastTemplatesPath = useRef("/templates");
  const lastMorePath = useRef("/more");

  // Update refs when location changes
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
    lastPathRef: React.RefObject<string>,
    isActive: boolean
  ) => {
    e.preventDefault();

    if (isActive) {
      // If already on this tab, scroll to top and navigate to root
      window.scrollTo({ top: 0, behavior: "instant" });
      if (location.pathname !== basePath) {
        navigate(basePath);
      }
    } else {
      // Navigate to last visited sub-route
      navigate(lastPathRef.current || basePath);
    }
  };

  const handleSimpleTabClick = (e: React.MouseEvent, isActive: boolean) => {
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "instant" });
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
        to="/templates"
        className={`tab ${isTemplatesActive ? "active" : ""}`}
        onClick={(e) => handleTabClick(e, "/templates", lastTemplatesPath, isTemplatesActive)}
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
        to="/more"
        className={`tab ${isMoreActive ? "active" : ""}`}
        onClick={(e) => handleTabClick(e, "/more", lastMorePath, isMoreActive)}
      >
        <CircleEllipsis size={24} />
        <span>More</span>
      </NavLink>
    </nav>
  );
}
