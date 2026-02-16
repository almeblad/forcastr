
// Helper to count workdays in a range (simplified M-F), optionally excluding specific holiday dates
export const countWorkDays = (start: Date, end: Date, holidays: string[] = []) => {
  let count = 0;
  let cur = new Date(start);
  
  // Normalize dates to YYYY-MM-DD for string comparison
  const toDateString = (d: Date) => {
    // We use Sweden/local time logic here, but safest for pure date comparison is UTC part
    // Actually, simpler:
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    const dateStr = toDateString(cur);
    
    // Check if it's a weekend (0=Sun, 6=Sat)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Only increment if NOT in the exclusion list
        if (!holidays.includes(dateStr)) {
            count++;
        }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

export const getMonthDateRange = (year: number, monthIndex: number) => {
    // monthIndex is 0-based (0=Jan, 11=Dec)
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0); // Last day of the month
    return { start, end };
};
