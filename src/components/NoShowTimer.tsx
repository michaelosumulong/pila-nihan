import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { calculateNoShowDeadline } from '@/utils/noShowEngine';

interface NoShowTimerProps {
  calledAt: string;
  ticketNumber: string;
}

export default function NoShowTimer({ calledAt, ticketNumber }: NoShowTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const deadline = new Date(calculateNoShowDeadline(calledAt)).getTime();
      const diff = deadline - Date.now();

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setIsExpired(true);
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        setIsWarning(mins < 5);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calledAt, ticketNumber]);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${
        isExpired
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-blue-50 text-blue-700'
      }`}
    >
      {isExpired ? (
        <>
          <AlertCircle size={16} />
          NO-SHOW ELIGIBLE
        </>
      ) : (
        <>
          <Clock size={16} />
          {timeLeft} remaining
        </>
      )}
    </div>
  );
}
