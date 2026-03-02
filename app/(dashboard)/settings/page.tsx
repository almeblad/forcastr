"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DEFAULT_TAX_SETTINGS_2026 } from "@/lib/calculations";
import { MUNICIPALITIES_2026 } from "@/lib/municipalities-2026";

type Municipality = {
  kommun: string;
  kommunal: number;
  landsting: number;
  begravning: number;
  kyrka?: number;
};

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [customTax, setCustomTax] = useState("");
  const [churchTaxEnabled, setChurchTaxEnabled] = useState(true);
  const [threshold, setThreshold] = useState(DEFAULT_TAX_SETTINGS_2026.stateTaxThreshold.toString());
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use local 2026 data
    const sorted = [...MUNICIPALITIES_2026].sort((a, b) => a.kommun.localeCompare(b.kommun));
    setMunicipalities(sorted);

    // Fetch workspace
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setCompanyName(data.name);
      });

    // Fetch tax settings
    fetch("/api/tax-settings")
      .then((res) => res.json())
      .then((data) => {
          if (data) {
            if (data.municipalityCode) {
              setSelectedMunicipality(data.municipalityCode);
            } else if (data.municipalTaxPercent) {
              setCustomTax(data.municipalTaxPercent);
            }
            setThreshold(data.stateTaxThreshold?.toString() || "643000");
            setChurchTaxEnabled(data.churchTaxEnabled ?? true);
          }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save workspace
      const wsRes = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName }),
      });
      if (!wsRes.ok) throw new Error("Failed to update workspace");

      let municipalTaxPercent = 30.0;
      let countyTaxPercent = 0;
      let burialFeePercent = 0.30;
      let municipalityCode = "";
      let municipalityName = "";

      if (selectedMunicipality) {
        const mun = municipalities.find(m => m.kommun === selectedMunicipality);
        if (mun) {
          municipalTaxPercent = mun.kommunal;
          countyTaxPercent = mun.landsting;
          burialFeePercent = mun.begravning;
          municipalityCode = mun.kommun;
          municipalityName = mun.kommun;
        }
      } else if (customTax) {
        municipalTaxPercent = parseFloat(customTax);
      }

      // Save tax settings
      const taxRes = await fetch("/api/tax-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              municipalityCode,
              municipalityName,
              municipalTaxPercent,
              countyTaxPercent,
              burialFeePercent,
              churchTaxEnabled,
              stateTaxThreshold: parseInt(threshold)
          }),
      });
      if (!taxRes.ok) throw new Error("Failed to update tax settings");

      toast("Inställningar sparade", {
        description: "Dina ändringar har uppdaterats.",
      });
      
      window.location.reload();
    } catch (error) {
      toast("Fel", {
        description: "Kunde inte spara inställningar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalTaxPercent = selectedMunicipality 
    ? (() => {
        const mun = municipalities.find(m => m.kommun === selectedMunicipality);
        if (!mun) return 0;
        let total = mun.kommunal + mun.landsting + mun.begravning;
        if (churchTaxEnabled) total += 1.0; // Estimate kyrkoavgift
        return total;
      })()
    : (customTax ? parseFloat(customTax) : 30);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inställningar</h1>

      <div className="grid gap-6">
        <Card className="max-w-2xl">
            <CardHeader>
            <CardTitle>Företagsinformation</CardTitle>
            <CardDescription>
                Hantera dina grundläggande företagsuppgifter.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="companyName">Företagsnamn</Label>
                <Input 
                id="companyName" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
                placeholder="Mitt Företag AB" 
                />
            </div>
            </CardContent>
        </Card>

        <Card className="max-w-2xl">
            <CardHeader>
            <CardTitle>Skatteinställningar (2026)</CardTitle>
            <CardDescription>
                Välj din kommun för korrekta skattesatser.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="municipality">Kommun</Label>
                <select 
                  id="municipality"
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedMunicipality}
                  onChange={(e) => {
                    setSelectedMunicipality(e.target.value);
                    if (e.target.value) setCustomTax("");
                  }}
                >
                  <option value="">Ange egen skattesats</option>
                  {municipalities.map(mun => (
                    <option key={mun.kommun} value={mun.kommun}>
                      {mun.kommun}
                    </option>
                  ))}
                </select>
            </div>

            {!selectedMunicipality && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customTax">Kommunalskatt (%)</Label>
                    <Input 
                        id="customTax" 
                        type="number"
                        step="0.01"
                        value={customTax} 
                        onChange={(e) => setCustomTax(e.target.value)} 
                        placeholder="30.00"
                    />
                </div>
              </div>
            )}

            {selectedMunicipality && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                {(() => {
                  const mun = municipalities.find(m => m.kommun === selectedMunicipality);
                  if (!mun) return null;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Kommunal skatt:</span>
                        <span>{mun.kommunal}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Landstingsskatt:</span>
                        <span>{mun.landsting}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Begravningsavgift:</span>
                        <span>{mun.begravning}%</span>
                      </div>
                      {churchTaxEnabled && (
                        <div className="flex justify-between">
                          <span>Kyrkoavgift (uppskattad):</span>
                          <span>~1.0%</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>Total skatt:</span>
                        <span>{totalTaxPercent.toFixed(3)}%</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
                <Switch
                    id="churchTax"
                    checked={churchTaxEnabled}
                    onCheckedChange={setChurchTaxEnabled}
                />
                <Label htmlFor="churchTax">Jag är medlem i Svenska kyrkan (inkl. kyrkoavgift)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="threshold">Brytpunkt statlig skatt (år)</Label>
                    <Input 
                        id="threshold" 
                        type="number"
                        value={threshold} 
                        onChange={(e) => setThreshold(e.target.value)} 
                    />
                </div>
            </div>
            </CardContent>
            <CardFooter>
            <Button onClick={handleSave} disabled={loading}>
                {loading ? "Sparar..." : "Spara alla ändringar"}
            </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
