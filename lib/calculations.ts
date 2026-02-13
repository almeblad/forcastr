// Core financial calculations

export type TaxYearSettings = {
  year: number;
  stateTaxThreshold: number; // Brytpunkt för statlig skatt (årslön)
  municipalityTaxPercent: number; // Kommunalskatt (t.ex. 30%)
  employerTaxPercent: number; // Arbetsgivaravgift (31.42%)
};

// Default settings for 2026
export const DEFAULT_TAX_SETTINGS_2026: TaxYearSettings = {
  year: 2026,
  stateTaxThreshold: 643000, // Enligt användarens uppgift
  municipalityTaxPercent: 30.0,
  employerTaxPercent: 31.42,
};

export const calculateSalaryCost = (
  grossSalary: number, 
  settings: TaxYearSettings = DEFAULT_TAX_SETTINGS_2026
) => {
  const employerTax = grossSalary * (settings.employerTaxPercent / 100);
  const totalCost = grossSalary + employerTax;
  
  return {
    grossSalary,
    employerTax,
    totalCost,
  };
};

export const calculateNetIncome = (
  grossSalary: number,
  settings: TaxYearSettings = DEFAULT_TAX_SETTINGS_2026
) => {
  const yearlySalary = grossSalary * 12;
  const isAboveThreshold = yearlySalary > settings.stateTaxThreshold;
  
  // Basic calculation - real world is more complex with jobbskatteavdrag etc.
  // This is a simplified estimation for planning purposes.
  const municipalityTax = grossSalary * (settings.municipalityTaxPercent / 100);
  let stateTax = 0;

  if (isAboveThreshold) {
    // Statlig skatt (20%) på belopp över brytpunkten
    // Notera: Detta är förenklat och bör beräknas på årsbasis egentligen,
    // men för månadsprognos gör vi en uppskattning.
    const monthlyThreshold = settings.stateTaxThreshold / 12;
    if (grossSalary > monthlyThreshold) {
      stateTax = (grossSalary - monthlyThreshold) * 0.20;
    }
  }

  const totalTax = municipalityTax + stateTax;
  const netSalary = grossSalary - totalTax;

  return {
    grossSalary,
    municipalityTax,
    stateTax,
    totalTax,
    netSalary,
  };
};

export const calculateConsultantRevenue = (
  hourlyRate: number,
  allocationPercent: number,
  workDaysInMonth: number = 21, // Genomsnitt
  brokerFeePercent: number = 0,
  absenceDays: number = 0
) => {
  const hoursPerDay = 8;
  const availableDays = Math.max(0, workDaysInMonth - absenceDays);
  const totalHours = availableDays * hoursPerDay;
  const billableHours = totalHours * (allocationPercent / 100);
  
  const grossRevenue = billableHours * hourlyRate;
  const brokerFee = grossRevenue * (brokerFeePercent / 100);
  const netRevenue = grossRevenue - brokerFee;

  return {
    billableHours,
    grossRevenue,
    brokerFee,
    netRevenue,
  };
};
