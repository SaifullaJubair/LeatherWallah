"use client";
import { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const FlashClockCounter = ({ endDate, startDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [progress, setProgress] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    const totalDuration = endTimestamp - startTimestamp;
    const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24)); // Total days for the countdown

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTimestamp - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setProgress({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Remaining time calculations
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      // Progress calculations for each unit
      const daysProgress = totalDays - days; // Days that have passed
      const hoursProgress = 24 - hours; // Hours that have passed in a day
      const minutesProgress = 60 - minutes; // Minutes that have passed in an hour
      const secondsProgress = 60 - seconds; // Seconds that have passed in a minute

      setProgress({
        days: daysProgress,
        hours: hoursProgress,
        minutes: minutesProgress,
        seconds: secondsProgress,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate]);

  return (
    <div className="flex items-center gap-2.5">
      {Object.entries(timeLeft).map(([unit, value], index) => {
        let max;
        let progressValue;
        if (unit === "days") {
          max = Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ); // Dynamic max days
          progressValue = progress.days;
        }
        if (unit === "hours") {
          max = 24;
          progressValue = progress.hours;
        }
        if (unit === "minutes") {
          max = 60;
          progressValue = progress.minutes;
        }
        if (unit === "seconds") {
          max = 60;
          progressValue = progress.seconds;
        }

        return (
          <div
            key={index}
            className="flex flex-col space-y-1 items-center justify-center w-16 h-w-16 "
          >
            {" "}
            <CircularProgressbar
              value={value}
              maxValue={max}
              text={`${String(value).padStart(2, "0")}`}
              styles={buildStyles({
                rotation: 0, // Start at 12 o'clock
                strokeLinecap: "round",
                textSize: "22px",
                pathTransitionDuration: 0.5,
                pathColor: `#0DA487`,
                textColor: "#1f2937",
                trailColor: "#d6d6d6",
                backgroundColor: "#d6d6d6",
              })}
              className=""
            />
            <span className="text-sm font-medium text-gray-500">
              {unit.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default FlashClockCounter;
