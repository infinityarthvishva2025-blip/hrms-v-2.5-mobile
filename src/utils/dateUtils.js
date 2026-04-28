import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString, formatStr = 'dd MMM yyyy') => {
  if (!dateString) return 'N/A';
  const dateObj = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  if (!isValid(dateObj)) return 'Invalid Date';
  return format(dateObj, formatStr);
};

export const formatTime = (timeString) => {
  if (!timeString) return '--:--';
  return timeString; // Assumes time string is already somewhat formatted or can be used as is
};
