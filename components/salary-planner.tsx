"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from 'use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  calculateSalaryCost,
  calculateNetIncome,
  TaxYearSettings
} from "@/lib/calculations";
import { MonthlyStats } from "@/lib/salary-stats";

// Helper for consistent formatting across SSR/CSR (Swedish locale)
const formatSEK = (value: number) => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = [
  { id: "01", name: "Januari" },
  { id: "02", name: "Februari" },
  { id: "03", name: "Mars" },
  { id: "04", name: "April" },
  { id: "05", name: "Maj" },
  { id: "06", name: "Juni" },
  { id: "07", name: "Juli" },
  { id: "08", name: "Augusti" },
  { id: "09", name: "September" },
  { id: "10", name: "Oktober" },
  { id: "11", name: "November" },
  { id: "12", name: "December" },
];

type SalaryPlannerProps = {
  workspaceId: string;
  initialSalaryMap: Record<string, { id?: string; grossSalary: number; pensionProvision?: number }>;
  taxSettings: TaxYearSettings;
  monthlyStats: MonthlyStats[];
};

export function SalaryPlanner({ workspaceId, initialSalaryMap, taxSettings, monthlyStats }: SalaryPlannerProps) {
  const [salaries, setSalaries] = useState(initialSalaryMap);
  const [syncAllMonths, setSyncAllMonths] = useState(false);

  console.log('Tax settings:', taxSettings);

  // Debounce the API call to avoid "Too Many Requests"
  const debouncedSave = useDebouncedCallback(async (monthKey: string, grossSalary: number) => {
    try {
      await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          month: monthKey,
          grossSalary,
        }),
      });
    } catch (err) {
      console.error("Failed to save salary", err);
    }
  }, 1000); // Wait 1000ms after last change before saving

  // Batch save for "Sync All" mode
  const debouncedBatchSave = useDebouncedCallback(async (grossSalary: number) => {
    MONTHS.forEach(m => {
      const key = `2026-${m.id}`;
      fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          month: key,
          grossSalary,
        }),
      }).catch(e => console.error(e));
    });
  }, 1000);

  const handleSalaryChange = (monthId: string, newValue: number) => {
    if (syncAllMonths) {
      const newSalaries = { ...salaries };
      MONTHS.forEach(m => {
        const key = `2026-${m.id}`;
        newSalaries[key] = { ...newSalaries[key], grossSalary: newValue };
      });
      setSalaries(newSalaries);
      debouncedBatchSave(newValue);
    } else {
      const monthKey = `2026-${monthId}`;
      const newEntry = {
        ...salaries[monthKey],
        grossSalary: newValue,
      };
      setSalaries((prev) => ({ ...prev, [monthKey]: newEntry }));
      debouncedSave(monthKey, newValue);
    }
  };

  const totals = useMemo(() => {
    let totalGross = 0;
    let totalCost = 0;
    let totalNet = 0;

    MONTHS.forEach((m) => {
      const key = `2026-${m.id}`;
      const gross = salaries[key]?.grossSalary || 0;

      const cost = calculateSalaryCost(gross, taxSettings);
      const net = calculateNetIncome(gross, taxSettings);

      totalGross += gross;
      totalCost += cost.totalCost;
      totalNet += net.netSalary;
    });

    return { totalGross, totalCost, totalNet };
  }, [salaries, taxSettings]);

  const progressToThreshold = (totals.totalGross / taxSettings.stateTaxThreshold) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Kostnad Bolag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lönekostnad</span>
              <span className="font-mono">{formatSEK(totals.totalGross)} kr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Arbetsgivaravgift</span>
              <span className="font-mono">-{formatSEK(Math.round(totals.totalCost - totals.totalGross))} kr</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-1 border-t">
              <span>Total</span>
              <span className="font-mono">{formatSEK(totals.totalCost)} kr</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ({taxSettings.employerTaxPercent}% avgift)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Skatt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(Math.round(totals.totalGross - totals.totalNet))} SEK</div>
            <div className="text-xs text-gray-500 mt-1">
              Kommunalskatt: {taxSettings.municipalityTaxPercent}% 
              (inkl begravningsavgift)
              {taxSettings.churchTaxEnabled ? ' + kyrkoavgift' : ''}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Nettolön</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatSEK(totals.totalNet)} SEK</div>
            <div className="text-xs text-gray-500 mt-1">
              {formatSEK(Math.round(totals.totalNet / 12))} kr/mån
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border shadow-sm">
        <Switch
          id="sync-mode"
          checked={syncAllMonths}
          onCheckedChange={setSyncAllMonths}
        />
        <Label htmlFor="sync-mode">Samma lön varje månad (Synka alla reglage)</Label>
      </div>

      <div className="grid gap-4">
        {MONTHS.map((month) => {
          const monthKey = `2026-${month.id}`;
          const currentSalary = salaries[monthKey]?.grossSalary || 0;
          const costs = calculateSalaryCost(currentSalary, taxSettings);
          const net = calculateNetIncome(currentSalary, taxSettings);

          // Get stats for this month
          const stats = monthlyStats.find(s => s.month === monthKey);
          const absenceDays = stats ? stats.absenceDays : 0;
          const workableHours = stats ? stats.workableHours : 0;

          return (
            <Card key={month.id} className="bg-white">
              <div className="flex flex-col md:flex-row items-center p-4 gap-4">
                <div className="w-full md:w-32 font-semibold flex flex-col">
                  <span>{month.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Arbetstid: {workableHours}h
                  </span>
                  {absenceDays > 0 && (
                    <span className="text-xs text-amber-600 font-normal mt-0.5">
                      Frånvaro: {absenceDays} {absenceDays === 1 ? 'dag' : 'dagar'}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex justify-between text-sm items-center">
                    <Label>Bruttolön</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={currentSalary}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSalaryChange(month.id, parseInt(e.target.value) || 0)}
                        className="w-24 h-8 text-right font-mono"
                        min={0}
                        max={200000}
                        step={100}
                      />
                      <span className="font-mono text-sm">kr</span>
                    </div>
                  </div>
                  <Slider
                    defaultValue={[currentSalary]}
                    value={[currentSalary]}
                    max={100000}
                    step={100}
                    onValueChange={(val) => handleSalaryChange(month.id, val[0])}
                  />
                </div>

                <div className="w-full md:w-64 text-xs flex flex-col gap-0.5 border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0 whitespace-nowrap">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kostnad</span>
                    <span className="font-mono">{formatSEK(Math.round(costs.totalCost))} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">varav arbetsgivaravgift</span>
                    <span className="font-mono">-{formatSEK(Math.round(costs.employerTax))} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skatt</span>
                    <span className="font-mono text-red-500">-{formatSEK(Math.round(net.totalTax))} kr</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Netto</span>
                    <span className="font-mono text-green-600">{formatSEK(Math.round(net.netSalary))} kr</span>
                  </div>

                  {stats && stats.projectedRevenue > 0 && (
                    <div className={`flex justify-between text-xs font-medium border-t pt-1 mt-1 ${stats.projectedRevenue >= costs.totalCost ? 'text-green-700' : 'text-red-600'
                      }`}>
                      <span>Resultat</span>
                      <span className="font-mono">
                        {stats.projectedRevenue >= costs.totalCost ? '+' : ''}
                        {formatSEK(Math.round(stats.projectedRevenue - costs.totalCost))} kr
                      </span>
                    </div>
                  )}
                  {stats && stats.projectedRevenue === 0 && (
                    <div className="text-xs text-slate-400 border-t pt-1 mt-1">
                      Inga intäkter
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
