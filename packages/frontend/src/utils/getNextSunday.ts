// Returns a Date object representing the next Sunday (including today if today is Sunday)
export function getNextSunday(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  const day = date.getDay();
  const diff = (7 - day) % 7; // 0 if today is Sunday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
