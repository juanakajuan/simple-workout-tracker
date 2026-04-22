import { useCallback, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutTemplate, CirclePlay, History, CircleEllipsis } from "lucide-react";

import "./BottomTabBar.css";

export function BottomTabBar(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const lastTemplatesPath = useRef("/templates");
  const lastHistoryPath = useRef("/history");
  const lastMorePath = useRef("/more");

  /** Returns whether the current route belongs to a tab section. */
  const isSectionActive = useCallback(
    (sectionPath: string): boolean => currentPath.startsWith(sectionPath),
    [currentPath]
  );

  /** Keeps tab click behavior consistent when re-selecting the active tab. */
  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  /** Builds the shared tab class name. */
  const getTabClassName = (isActive: boolean): string => `tab ${isActive ? "active" : ""}`;

  // Update refs when location changes
  useEffect(() => {
    if (isSectionActive("/templates")) {
      lastTemplatesPath.current = currentPath;
    } else if (isSectionActive("/history")) {
      lastHistoryPath.current = currentPath;
    } else if (isSectionActive("/more")) {
      lastMorePath.current = currentPath;
    }
  }, [currentPath, isSectionActive]);

  const isTemplatesActive = isSectionActive("/templates");
  const isHistoryActive = isSectionActive("/history");
  const isMoreActive = isSectionActive("/more");

  /**
   * Handles clicking on a tab with sub-routes. If already active, scrolls to top
   * and navigates to the base route. If not active, navigates to the last visited
   * sub-route for that tab using replace to avoid cluttering history.
   *
   * @param event - The mouse event
   * @param sectionPath - The base path for the tab (e.g., "/templates")
   * @param lastVisitedPathReference - Reference to the last visited path for this tab
   * @param isActive - Whether the tab is currently active
   */
  const handleTabClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionPath: string,
    lastVisitedPathReference: React.RefObject<string>,
    isActive: boolean
  ): void => {
    event.preventDefault();

    if (isActive) {
      scrollToTop();
      if (currentPath !== sectionPath) {
        navigate(sectionPath);
      }
    } else {
      navigate(lastVisitedPathReference.current || sectionPath, { replace: true });
    }
  };

  /**
   * Handles clicking on a simple tab (without sub-routes). If already active,
   * prevents navigation and scrolls to the top of the page.
   *
   * @param event - The mouse event
   * @param isActive - Whether the tab is currently active
   */
  const handleSimpleTabClick = (event: React.MouseEvent<HTMLAnchorElement>, isActive: boolean): void => {
    if (isActive) {
      event.preventDefault();
      scrollToTop();
    }
  };

  return (
    <nav className="bottom-tab-bar">
      <NavLink
        to="/exercises"
        className={({ isActive }) => getTabClassName(isActive)}
        aria-label="Exercises"
        onClick={(event) => handleSimpleTabClick(event, currentPath === "/exercises")}
      >
        <Dumbbell size={28} />
      </NavLink>

      <NavLink
        to="/templates"
        className={getTabClassName(isTemplatesActive)}
        aria-label="Templates"
        onClick={(event) => handleTabClick(event, "/templates", lastTemplatesPath, isTemplatesActive)}
      >
        <LayoutTemplate size={28} />
      </NavLink>

      <NavLink
        to="/workout"
        className={({ isActive }) => getTabClassName(isActive)}
        aria-label="Workout"
        onClick={(event) => handleSimpleTabClick(event, currentPath === "/workout")}
      >
        <CirclePlay size={28} />
      </NavLink>

      <NavLink
        to="/history"
        className={getTabClassName(isHistoryActive)}
        aria-label="History"
        onClick={(event) => handleTabClick(event, "/history", lastHistoryPath, isHistoryActive)}
      >
        <History size={28} />
      </NavLink>

      <NavLink
        to="/more"
        className={getTabClassName(isMoreActive)}
        aria-label="More"
        onClick={(event) => handleTabClick(event, "/more", lastMorePath, isMoreActive)}
      >
        <CircleEllipsis size={28} />
      </NavLink>
    </nav>
  );
}
