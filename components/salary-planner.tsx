"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from 'use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  calculateSalaryCost, 
  calculateNetIncome, 
  TaxYearSettings 
} from "@/lib/calculations";

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
};

export function SalaryPlanner({ workspaceId, initialSalaryMap, taxSettings }: SalaryPlannerProps) {
  const [salaries, setSalaries] = useState(initialSalaryMap);
  const [syncAllMonths, setSyncAllMonths] = useState(false);

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
     // Sending 12 requests at once is still risky for rate limits, so in a real app
     // we would create a batch endpoint. For now, we'll just iterate but with the debounce
     // it happens once at the end of the drag.
     MONTHS.forEach(m => {
        const key = `2026-${m.id}`;
        // We call the fetch directly here or use a separate batch endpoint
        // Using the existing endpoint for simplicity but strictly debounced
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
            <CardTitle className="text-sm font-medium text-gray-500">Total Årslön (Brutto)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(totals.totalGross)} SEK</div>
            <div className="text-xs text-gray-500 mt-1">
               {formatSEK(Math.max(0, taxSettings.stateTaxThreshold - totals.totalGross))} kvar till brytpunkt ({formatSEK(taxSettings.stateTaxThreshold)})
            </div>
            <div className="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden">
               <div 
                 className={`h-full ${progressToThreshold > 100 ? 'bg-red-500' : 'bg-green-500'}`} 
                 style={{ width: `${Math.min(100, progressToThreshold)}%` }}
               />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Kostnad Bolag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(totals.totalCost)} SEK</div>
            <div className="text-xs text-gray-500 mt-1">Inkl. arbetsgivaravgift ({taxSettings.employerTaxPercent}%)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Estimerad Nettolön</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSEK(totals.totalNet)} SEK</div>
             <div className="text-xs text-gray-500 mt-1">Beräknat på {taxSettings.municipalityTaxPercent}% kommunalskatt</div>
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

          return (
            <Card key={month.id} className="bg-white">
              <div className="flex items-center p-4 gap-4">
                <div className="w-24 font-semibold">{month.name}</div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Bruttolön</Label>
                    <span className="font-mono">{formatSEK(currentSalary)} kr</span>
                  </div>
                  <Slider
                    defaultValue={[currentSalary]}
                    value={[currentSalary]}
                    max={100000}
                    step={1000}
                    onValueChange={(val) => handleSalaryChange(month.id, val[0])}
                  />
                </div>

                <div className="w-32 text-right text-sm">
                   <div className="text-gray-500">Kostnad: {formatSEK(Math.round(costs.totalCost))}</div>
                   <div className="font-medium text-green-600">Netto: {formatSEK(Math.round(net.netSalary))}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
