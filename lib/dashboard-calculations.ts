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
  cashIn: number;
  brokerFee: number;
  salaryCost: number;
  profit: number;
};

import { countWorkDays, getMonthDateRange } from './date-utils';

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

  // Calculate Cash Flow Map (Payment Date -> Amount)
  const cashFlowMap = new Map<string, number>();

  assignments.forEach(assignment => {
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);
    
    // Iterate through each month the assignment is active
    // We go from start month to end month
    let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (currentMonth <= endMonth) {
       const monthStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;
       
       // Calculate revenue for this month
       // 1. Determine intersection of assignment and month
       const mStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
       const mEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
       
       const activeStart = start > mStart ? start : mStart;
       const activeEnd = end < mEnd ? end : mEnd;

       if (activeStart <= activeEnd) {
         // Calculate absence days within the active assignment period for this month
         let absenceDays = 0;
         absences.forEach(absence => {
            const absStart = new Date(absence.startDate);
            const absEnd = new Date(absence.endDate);
            const overlapStart = absStart > activeStart ? absStart : activeStart;
            const overlapEnd = absEnd < activeEnd ? absEnd : activeEnd;
            if (overlapStart <= overlapEnd) {
                absenceDays += countWorkDays(overlapStart, overlapEnd);
            }
         });

         const workDays = countWorkDays(activeStart, activeEnd);
         
         const { grossRevenue, brokerFee } = calculateConsultantRevenue(
            assignment.hourlyRate,
            assignment.allocationPercent,
            workDays, 
            Number(assignment.brokerFeePercent || 0),
            absenceDays
         );
         
         const netRevenue = grossRevenue - brokerFee;

         // Determine Payment Date
         // Payment is usually based on invoice date (end of month) + terms
         const invoiceDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0); // End of month
         const paymentDate = new Date(invoiceDate);
         paymentDate.setDate(paymentDate.getDate() + (assignment.paymentTerms || 30));
         
         const paymentMonthStr = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;
         
         const currentVal = cashFlowMap.get(paymentMonthStr) || 0;
         cashFlowMap.set(paymentMonthStr, currentVal + netRevenue);
       }

       // Next month
       currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
  });

  return months.map(month => {
    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(year, new Date(month).getMonth() + 1, 0);

    // 1. Calculate Revenue (Invoiced)
    let totalRevenue = 0;
    let totalBrokerFee = 0;
    
    assignments.forEach(assignment => {
      const start = new Date(assignment.startDate);
      const end = new Date(assignment.endDate);

      const activeStart = start > monthStart ? start : monthStart;
      const activeEnd = end < monthEnd ? end : monthEnd;

      if (activeStart <= activeEnd) {
        // Calculate absence days within the active assignment period for this month
        let absenceDays = 0;
        absences.forEach(absence => {
            const absStart = new Date(absence.startDate);
            const absEnd = new Date(absence.endDate);
            const overlapStart = absStart > activeStart ? absStart : activeStart;
            const overlapEnd = absEnd < activeEnd ? absEnd : activeEnd;
            if (overlapStart <= overlapEnd) {
                absenceDays += countWorkDays(overlapStart, overlapEnd);
            }
        });

        const workDays = countWorkDays(activeStart, activeEnd);
        
        const { grossRevenue, brokerFee } = calculateConsultantRevenue(
            assignment.hourlyRate,
            assignment.allocationPercent,
            workDays, 
            Number(assignment.brokerFeePercent || 0),
            absenceDays 
        );
        totalRevenue += (grossRevenue - brokerFee);
        totalBrokerFee += brokerFee;
      }
    });

    // 2. Cash In
    const cashIn = cashFlowMap.get(month) || 0;

    // 3. Calculate Salary Cost
    const salaryEntry = salaries.find(s => s.month === month);
    const grossSalary = salaryEntry ? salaryEntry.grossSalary : 0;
    const { totalCost } = calculateSalaryCost(grossSalary, DEFAULT_TAX_SETTINGS_2026);

    // 4. Profit
    const profit = totalRevenue - totalCost;

    return {
      month,
      revenue: totalRevenue,
      cashIn,
      brokerFee: totalBrokerFee,
      salaryCost: totalCost,
      profit
    };
  });
};
