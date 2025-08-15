// Returns a Date object representing today's date with time set to 00:00:00
export function getToday(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  return date;
}
