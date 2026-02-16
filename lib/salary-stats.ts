
import { getMonthDateRange, countWorkDays } from './date-utils';
import { Holiday } from './holidays';

export type MonthlyStats = {
  month: string; // YYYY-MM
  totalWorkDays: number;
  absenceDays: number;
  workableDays: number;
  workableHours: number;
  projectedRevenue: number;
};

export const calculateMonthlyStats = (
  year: number,
  absences: any[], 
  holidays: Holiday[],
  assignments: any[] = []
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

    // Calculate Projected Revenue based on assignments
    let projectedRevenue = 0;
    
    assignments.forEach(assignment => {
        const assignStart = new Date(assignment.startDate);
        const assignEnd = new Date(assignment.endDate);

        // Check intersection between assignment period and current month
        const activeStart = assignStart > monthStart ? assignStart : monthStart;
        const activeEnd = assignEnd < monthEnd ? assignEnd : monthEnd;

        if (activeStart <= activeEnd) {
            // Calculate WORK days in this active period (excluding holidays)
            // Note: We need to subtract absences that fall specifically within this assignment period
            // Ideally, we'd check day-by-day. For a simpler approximation or correct implementation:
            
            let assignmentWorkDays = 0;
            let current = new Date(activeStart);
            while (current <= activeEnd) {
                const d = current.getDay();
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const day = String(current.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;

                // If it's a workday (M-F) and NOT a holiday
                if (d !== 0 && d !== 6 && !holidayDates.includes(dateStr)) {
                     // AND not an "effective absence" day
                     if (!effectiveAbsenceDaysSet.has(dateStr)) {
                         assignmentWorkDays++;
                     }
                }
                current.setDate(current.getDate() + 1);
            }

            const hours = assignmentWorkDays * 8;
            const allocation = (assignment.allocationPercent || 100) / 100;
            const rate = assignment.hourlyRate || 0;
            const brokerFee = Number(assignment.brokerFeePercent || 0) / 100;
            
            projectedRevenue += (hours * allocation * rate) * (1 - brokerFee);
        }
    });


    return {
      month: `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`,
      totalWorkDays,
      absenceDays: uiAbsenceDays, 
      workableDays,
      workableHours,
      projectedRevenue
    };
  });
};
