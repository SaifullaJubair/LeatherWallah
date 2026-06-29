"use client";
import { useEffect, useState } from "react";

const CountdownTimer = ({ startDate, endDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Initialize immediately
    return () => clearInterval(timerInterval);
  }, [endDate]);

  return (
    <>
      <div className="flex items-center justify-center absolute top-1/2 left-0 right-0 bottom-0 gap-3 rounded">
        {["days", "hours", "minutes", "seconds"].map((unit, index) => (
          <div
            className="w-14 h-14 flex flex-col items-center justify-center bg-white shadow-md border border-primary-100 rounded"
            key={index}
          >
            <p className="font-bold text-primary">
              {String(timeLeft[unit]).padStart(2, "0")}
            </p>
            <p className="text-xs text-gray-500 capitalize">{unit}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default CountdownTimer;
