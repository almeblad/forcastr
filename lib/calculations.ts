// Core financial calculations for Swedish taxes

const PRICE_BASE_AMOUNT_2026 = 59200;
const STATE_TAX_THRESHOLD_2026 = 643000;
const MAX_JOB_TAX_DEDUCTION_2026 = 60000; // Higher max for 2026
const PUBLIC_SERVICE_FEE_YEARLY = 1184;
const EARNED_INCOME_DEDUCTION_YEARLY = 1500; // Skattereduktion för förvärvsinkomst
const CHURCH_TAX_PERCENT = 0.60;

export type TaxYearSettings = {
  year: number;
  stateTaxThreshold: number;
  municipalityTaxPercent: number;
  countyTaxPercent?: number;
  employerTaxPercent: number;
  churchTaxEnabled?: boolean;
  burialFeePercent?: number;
};

export const DEFAULT_TAX_SETTINGS_2026: TaxYearSettings = {
  year: 2026,
  stateTaxThreshold: STATE_TAX_THRESHOLD_2026,
  municipalityTaxPercent: 30.0,
  employerTaxPercent: 31.42,
  churchTaxEnabled: true,
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

const calculateBasicDeduction = (yearlyIncome: number): number => {
  const pbb = PRICE_BASE_AMOUNT_2026;
  
  const limit1 = 0.99 * pbb;
  const limit2 = 2.72 * pbb;
  const limit3 = 3.11 * pbb;
  const limit4 = 7.88 * pbb;
  const limit5 = 8.87 * pbb;
  
  if (yearlyIncome <= limit1) {
    return 0;
  } else if (yearlyIncome <= limit2) {
    return 0.293 * (yearlyIncome - limit1);
  } else if (yearlyIncome <= limit3) {
    return 0.506 * pbb;
  } else if (yearlyIncome <= limit4) {
    return 0.11 * (yearlyIncome - 1.01 * pbb);
  } else if (yearlyIncome <= limit5) {
    return 0.2 * (yearlyIncome - limit4);
  } else {
    return Math.max(17400, 0.1 * (yearlyIncome - limit5));
  }
};

const calculateJobTaxDeduction = (yearlyIncome: number): number => {
  const pbb = PRICE_BASE_AMOUNT_2026;
  const maxDeduction = MAX_JOB_TAX_DEDUCTION_2026;
  
  // Different brackets for job tax deduction
  const lowerBound1 = 0.5 * pbb;
  const upperBound1 = 1.5 * pbb;
  const lowerBound2 = 1.5 * pbb;
  const upperBound2 = 3.0 * pbb;
  
  if (yearlyIncome <= lowerBound1) {
    return 0;
  } else if (yearlyIncome <= upperBound1) {
    // Lower income bracket - higher percentage
    const progress = (yearlyIncome - lowerBound1) / (upperBound1 - lowerBound1);
    return maxDeduction * 0.564 * progress; // ~60% of max in this range
  } else if (yearlyIncome <= upperBound2) {
    // Middle bracket
    const progress = (yearlyIncome - upperBound1) / (upperBound2 - upperBound1);
    return maxDeduction * (0.564 + 0.436 * progress);
  } else {
    return maxDeduction;
  }
};

export const calculateNetIncome = (
  grossSalary: number,
  settings: TaxYearSettings = DEFAULT_TAX_SETTINGS_2026
) => {
  const monthlySalary = grossSalary;
  const yearlySalary = monthlySalary * 12;

  // Municipal tax rate (kommunal + landsting + begravning)
  const burialFeeRate = settings.burialFeePercent ?? 0.25;
  const countyTaxRate = settings.countyTaxPercent ?? 0;
  const municipalTaxRate = (settings.municipalityTaxPercent + countyTaxRate + burialFeeRate) / 100;

  // Calculate basic deduction (grundavdrag) - reduces taxable income
  const basicDeductionYearly = calculateBasicDeduction(yearlySalary);
  const taxableIncome = Math.max(0, yearlySalary - basicDeductionYearly);
  const basicDeduction = basicDeductionYearly / 12;

  // Calculate municipal tax on TAXABLE income (after grundavdrag)
  const municipalTaxYearly = taxableIncome * municipalTaxRate;
  const municipalTax = municipalTaxYearly / 12;

  // State tax (20% on income above threshold)
  let stateTaxYearly = 0;
  if (taxableIncome > STATE_TAX_THRESHOLD_2026) {
    stateTaxYearly = (taxableIncome - STATE_TAX_THRESHOLD_2026) * 0.20;
  }
  const stateTax = stateTaxYearly / 12;

  // Calculate job tax deduction (jobbskatteavdrag)
  // Based on gross income, reduces final tax
  const jobTaxDeductionYearly = calculateJobTaxDeduction(yearlySalary);
  
  // Total tax before deductions
  const totalTaxBeforeDeductions = municipalTaxYearly + stateTaxYearly;
  
  // Job tax deduction reduces the total tax (but not below 0)
  const jobTaxReductionYearly = Math.min(jobTaxDeductionYearly, totalTaxBeforeDeductions);
  const jobTaxReduction = jobTaxReductionYearly / 12;

  // Earned income deduction (skattereduktion för förvärvsinkomst)
  const remainingTaxAfterJob = totalTaxBeforeDeductions - jobTaxDeductionYearly;
  const earnedIncomeDeductionYearly = Math.min(EARNED_INCOME_DEDUCTION_YEARLY, Math.max(0, remainingTaxAfterJob));
  const earnedIncomeDeduction = Math.max(0, earnedIncomeDeductionYearly / 12);

  // Public service fee (radiotjänst)
  const publicServiceFee = PUBLIC_SERVICE_FEE_YEARLY / 12;

  // Total tax calculation
  const totalTaxYearly = Math.max(0, totalTaxBeforeDeductions - jobTaxReductionYearly - earnedIncomeDeductionYearly);
  const totalTax = totalTaxYearly / 12;

  const netSalaryYearly = yearlySalary - totalTaxYearly - PUBLIC_SERVICE_FEE_YEARLY;
  const netSalary = netSalaryYearly / 12;

  return {
    grossSalary,
    basicDeduction,
    taxableIncome: taxableIncome / 12,
    municipalTax,
    stateTax,
    jobTaxDeduction: jobTaxReduction,
    earnedIncomeDeduction,
    publicServiceFee,
    totalTax: totalTax + publicServiceFee,
    netSalary,
  };
};

export const calculateConsultantRevenue = (
  hourlyRate: number,
  allocationPercent: number,
  workDaysInMonth: number = 21,
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
