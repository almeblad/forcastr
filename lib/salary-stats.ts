
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

  // --- Pre-calculate Revenue with Payment Terms Shift ---
  const monthlyRevenueMap: Record<string, number> = {};
  
  // Initialize map for the target year
  months.forEach(m => {
    monthlyRevenueMap[`${year}-${String(m + 1).padStart(2, '0')}`] = 0;
  });

  assignments.forEach(assignment => {
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);
    const terms = assignment.paymentTerms || 30; // Default 30 days

    // We iterate from the start month of the assignment to the end month
    // We need to cover enough months back to catch payments falling into the target year
    // E.g. if terms=60 days, work in Nov 2025 pays in Jan 2026.
    // So we shouldn't just look at [start, end], but rather filter relevant months?
    // Actually, simply iterating [start, end] is safer to catch everything.
    // Optimizing: start iterating from (targetYear - 1) at least?
    // Let's just iterate from start to end. If start is 2020, it might be slow?
    // Let's clamp start to (targetYear - 1) just in case.
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    // Optimization: Don't process way back in the past
    const minDate = new Date(year - 1, 0, 1);
    if (current < minDate) current = minDate;

    const assignmentEndMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= assignmentEndMonth) {
      const currentYear = current.getFullYear();
      const currentMonthIndex = current.getMonth();
      
      const { start: monthStart, end: monthEnd } = getMonthDateRange(currentYear, currentMonthIndex);
      
      // Calculate intersection with assignment
      const activeStart = start > monthStart ? start : monthStart;
      const activeEnd = end < monthEnd ? end : monthEnd;

      if (activeStart <= activeEnd) {
          // Holidays for this specific year (only have them for target year)
          const relevantHolidays = (currentYear === year) ? holidayDates : [];
          
          const workDays = countWorkDays(activeStart, activeEnd, relevantHolidays);
          
          // Calculate effective absences for this specific period
          let effectiveAbsenceDays = 0;
          
          // Only calculate absences if we are in the target year where we have holiday data
          // For past years, we assume 0 absences or simplified logic
          if (currentYear === year) {
            const periodAbsencesSet = new Set<string>();
            absences.forEach(absence => {
                const absStart = new Date(absence.startDate);
                const absEnd = new Date(absence.endDate);
                
                const overlapStart = absStart > activeStart ? absStart : activeStart;
                const overlapEnd = absEnd < activeEnd ? absEnd : activeEnd;
                
                if (overlapStart <= overlapEnd) {
                    let d = new Date(overlapStart);
                    while (d <= overlapEnd) {
                        const dayOfWeek = d.getDay();
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${day}`;
                        
                        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !relevantHolidays.includes(dateStr)) {
                            periodAbsencesSet.add(dateStr);
                        }
                        d.setDate(d.getDate() + 1);
                    }
                }
            });
            effectiveAbsenceDays = periodAbsencesSet.size;
          }

          const workableDays = Math.max(0, workDays - effectiveAbsenceDays);
          const hours = workableDays * 8;
          
          const allocation = (assignment.allocationPercent || 100) / 100;
          const rate = assignment.hourlyRate || 0;
          const brokerFee = Number(assignment.brokerFeePercent || 0) / 100;
          
          const earnedRevenue = (hours * allocation * rate) * (1 - brokerFee);
          
          // Determine Payment Date: Invoice (End of Month) + Terms
          const paymentDate = new Date(monthEnd);
          paymentDate.setDate(paymentDate.getDate() + terms);
          
          const payYear = paymentDate.getFullYear();
          const payMonth = String(paymentDate.getMonth() + 1).padStart(2, '0');
          const payMonthKey = `${payYear}-${payMonth}`;
          
          // Add to map if key exists (meaning it's in target year)
          if (monthlyRevenueMap[payMonthKey] !== undefined) {
             monthlyRevenueMap[payMonthKey] += earnedRevenue;
          }
      }
      
      current.setMonth(current.getMonth() + 1);
    }
  });


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

    // Use the pre-calculated shifted revenue
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const projectedRevenue = monthlyRevenueMap[monthKey] || 0;

    return {
      month: monthKey,
      totalWorkDays,
      absenceDays: uiAbsenceDays, 
      workableDays,
      workableHours,
      projectedRevenue
    };
  });
};

