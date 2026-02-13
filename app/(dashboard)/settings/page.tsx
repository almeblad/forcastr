"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DEFAULT_TAX_SETTINGS_2026 } from "@/lib/calculations";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [municipalityTax, setMunicipalityTax] = useState(DEFAULT_TAX_SETTINGS_2026.municipalityTaxPercent.toString());
  const [threshold, setThreshold] = useState(DEFAULT_TAX_SETTINGS_2026.stateTaxThreshold.toString());
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
              setMunicipalityTax(data.municipalityTaxPercent.toString());
              setThreshold(data.stateTaxThreshold.toString());
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

      // Save tax settings
      const taxRes = await fetch("/api/tax-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              municipalityTaxPercent: parseFloat(municipalityTax),
              stateTaxThreshold: parseInt(threshold)
          }),
      });
      if (!taxRes.ok) throw new Error("Failed to update tax settings");

      toast("Inställningar sparade", {
        description: "Dina ändringar har uppdaterats.",
      });
      
      // Reload to update header (simple way)
      window.location.reload();
    } catch (error) {
      toast("Fel", {
        description: "Kunde inte spara inställningar.",
      });
    } finally {
      setLoading(false);
    }
  };

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
                Justera skattesatser för korrekta beräkningar.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="municipalityTax">Kommunalskatt (%)</Label>
                    <Input 
                        id="municipalityTax" 
                        type="number"
                        step="0.01"
                        value={municipalityTax} 
                        onChange={(e) => setMunicipalityTax(e.target.value)} 
                    />
                </div>
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
