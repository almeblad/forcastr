
import { getMonthDateRange, countWorkDays } from './date-utils';
import { Holiday } from './holidays';

export type MonthlyStats = {
  month: string; // YYYY-MM
  totalWorkDays: number;
  absenceDays: number;
  workableDays: number;
  workableHours: number;
};

export const calculateMonthlyStats = (
  year: number,
  absences: any[], 
  holidays: Holiday[]
): MonthlyStats[] => {
  const months = Array.from({ length: 12 }, (_, i) => i); // 0..11

  // Filter for work-free holidays only
  const holidayDates = holidays
    .filter(h => h.isWorkFree)
    .map(h => h.date); // YYYY-MM-DD strings

  return months.map(monthIndex => {
    const { start: monthStart, end: monthEnd } = getMonthDateRange(year, monthIndex);
    
    // 1. Total available work days in month (minus weekends and holidays)
    const totalWorkDays = countWorkDays(new Date(monthStart), new Date(monthEnd), holidayDates);

    // Use Sets to track unique absence days to handle overlaps
    const uiAbsenceDaysSet = new Set<string>();
    const effectiveAbsenceDaysSet = new Set<string>();

    absences.forEach(absence => {
      const absStart = new Date(absence.startDate);
      const absEnd = new Date(absence.endDate);

      // Check overlap with the current month
      const overlapStart = absStart > monthStart ? absStart : monthStart;
      const overlapEnd = absEnd < monthEnd ? absEnd : monthEnd;

      if (overlapStart <= overlapEnd) {
        let current = new Date(overlapStart);
        while (current <= overlapEnd) {
          const dayOfWeek = current.getDay();
          // Format date as YYYY-MM-DD
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          // Skip weekends
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // "UI Absence": Count all M-F days, even holidays.
            uiAbsenceDaysSet.add(dateStr);
            
            // "Capacity Absence": Count only WORK days lost (exclude holidays).
            // Only add if it's NOT a holiday.
            if (!holidayDates.includes(dateStr)) {
              effectiveAbsenceDaysSet.add(dateStr);
            }
          }
          current.setDate(current.getDate() + 1);
        }
      }
    });

    const uiAbsenceDays = uiAbsenceDaysSet.size;
    const effectiveAbsenceDays = effectiveAbsenceDaysSet.size;

    const workableDays = Math.max(0, totalWorkDays - effectiveAbsenceDays);
    const workableHours = workableDays * 8; // Assuming 8h work day

    return {
      month: `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`,
      totalWorkDays,
      absenceDays: uiAbsenceDays, 
      workableDays,
      workableHours
    };
  });
};
