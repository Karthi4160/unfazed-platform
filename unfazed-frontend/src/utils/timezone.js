import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

export const convertToLocal = (utcDate, timezone) => {
  if (!utcDate) return null;
  return toZonedTime(new Date(utcDate), timezone);
};

export const convertToUTC = (localDate, timezone) => {
  if (!localDate) return null;
  return fromZonedTime(localDate, timezone);
};

export const formatInUserTimezone = (date, timezone = 'Asia/Kolkata') => {
  if (!date) return '';
  return formatInTimeZone(new Date(date), timezone, 'MMM d, yyyy h:mm a zzz');
};

export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
