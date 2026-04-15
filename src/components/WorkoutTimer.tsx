import { useState, useEffect } from "react";

import "./WorkoutTimer.css";

/**
 * Props for the WorkoutTimer component.
 */
interface WorkoutTimerProps {
  startTime: string;
}

/**
 * Formats elapsed seconds into HH:MM:SS format.
 *
 * @param seconds - Total elapsed seconds
 * @returns Formatted time string in HH:MM:SS format
 *
 * @example
 * formatElapsedTime(3665) // Returns "1:01:05"
 * formatElapsedTime(45) // Returns "0:00:45"
 */
function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function WorkoutTimer({ startTime }: WorkoutTimerProps): React.ReactElement {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Calculate initial elapsed time
    const startTimeMs = new Date(startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeMs) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Update immediately
    updateElapsed();

    // Set up interval to update every second
    const interval = setInterval(updateElapsed, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="workout-timer">
      <span className="workout-timer-label">Elapsed:</span>
      <time className="workout-timer-display">{formatElapsedTime(elapsedSeconds)}</time>
    </div>
  );
}
