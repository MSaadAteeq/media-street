import { useState, useEffect } from 'react';

export const useWeeklyCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // Convert current time to ET
      const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      
      // Find next Sunday 11:59 PM ET
      const nextSunday = new Date(etTime);
      const currentDay = etTime.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Calculate days until next Sunday (0 if today is Sunday)
      const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
      
      nextSunday.setDate(etTime.getDate() + daysUntilSunday);
      nextSunday.setHours(23, 59, 59, 999);
      
      // If we're past Sunday 11:59 PM, move to next Sunday
      if (etTime > nextSunday) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      }
      
      const diff = nextSunday.getTime() - etTime.getTime();
      
      if (diff <= 0) {
        // Reset has occurred, calculate next week
        nextSunday.setDate(nextSunday.getDate() + 7);
        const newDiff = nextSunday.getTime() - etTime.getTime();
        return formatTime(newDiff);
      }
      
      return formatTime(diff);
    };

    const formatTime = (milliseconds: number) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      
      return `${days}d ${hours}h ${minutes}m`;
    };

    // Update immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return timeRemaining;
};
