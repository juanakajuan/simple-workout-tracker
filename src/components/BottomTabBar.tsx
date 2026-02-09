import { useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutTemplate, CirclePlay, History, CircleEllipsis } from "lucide-react";

import "./BottomTabBar.css";

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

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

  /**
   * Handles clicking on a tab with sub-routes. If already active, scrolls to top
   * and navigates to the base route. If not active, navigates to the last visited
   * sub-route for that tab using replace to avoid cluttering history.
   *
   * @param event - The mouse event
   * @param basePath - The base path for the tab (e.g., "/templates")
   * @param lastPathRef - Reference to the last visited path for this tab
   * @param isActive - Whether the tab is currently active
   */
  const handleTabClick = (
    event: React.MouseEvent,
    basePath: string,
    lastPathRef: React.RefObject<string>,
    isActive: boolean
  ) => {
    event.preventDefault();

    if (isActive) {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (location.pathname !== basePath) {
        navigate(basePath);
      }
    } else {
      navigate(lastPathRef.current || basePath, { replace: true });
    }
  };

  /**
   * Handles clicking on a simple tab (without sub-routes). If already active,
   * prevents navigation and scrolls to the top of the page.
   *
   * @param event - The mouse event
   * @param isActive - Whether the tab is currently active
   */
  const handleSimpleTabClick = (event: React.MouseEvent, isActive: boolean) => {
    if (isActive) {
      event.preventDefault();
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
