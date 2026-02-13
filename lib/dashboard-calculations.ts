// Aggregated financial calculations for dashboard
import { 
  calculateSalaryCost, 
  calculateConsultantRevenue, 
  TaxYearSettings,
  DEFAULT_TAX_SETTINGS_2026
} from './calculations';

export type MonthlyFinancials = {
  month: string; // YYYY-MM
  revenue: number;
  salaryCost: number;
  profit: number;
};

// Helper to count workdays in a range (simplified M-F)
const countWorkDays = (start: Date, end: Date) => {
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

export const calculateMonthlyFinancials = (
  assignments: any[], 
  salaries: any[],
  absences: any[] = [],
  year: number = 2026
): MonthlyFinancials[] => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `${year}-${m.toString().padStart(2, '0')}`;
  });

  return months.map(month => {
    // 0. Calculate Absence Days for this month
    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(year, new Date(month).getMonth() + 1, 0);
    
    let absenceDays = 0;
    absences.forEach(absence => {
      const absStart = new Date(absence.startDate);
      const absEnd = new Date(absence.endDate);

      // Check overlap
      const overlapStart = absStart > monthStart ? absStart : monthStart;
      const overlapEnd = absEnd < monthEnd ? absEnd : monthEnd;

      if (overlapStart <= overlapEnd) {
        absenceDays += countWorkDays(overlapStart, overlapEnd);
      }
    });

    // 1. Calculate Revenue
    let totalRevenue = 0;
    
    // Find active assignments for this month
    assignments.forEach(assignment => {
      if (assignment.startDate <= month + '-31' && assignment.endDate >= month + '-01') {
        const { netRevenue } = calculateConsultantRevenue(
            assignment.hourlyRate,
            assignment.allocationPercent,
            21, // Avg working days base
            Number(assignment.brokerFeePercent || 0),
            absenceDays // Pass absence days to reduce billable time
        );
        totalRevenue += netRevenue;
      }
    });

    // 2. Calculate Salary Cost
    const salaryEntry = salaries.find(s => s.month === month);
    const grossSalary = salaryEntry ? salaryEntry.grossSalary : 0;
    const { totalCost } = calculateSalaryCost(grossSalary, DEFAULT_TAX_SETTINGS_2026);

    // 3. Profit
    const profit = totalRevenue - totalCost;

    return {
      month,
      revenue: totalRevenue,
      salaryCost: totalCost,
      profit
    };
  });
};
