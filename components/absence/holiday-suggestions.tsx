"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Loader2, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Holiday = {
  date: string;
  name: string;
  type: "Holiday" | "Bridge";
  isWorkFree: boolean;
};

export function HolidaySuggestions({ workspaceId }: { workspaceId: string }) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchHolidays() {
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`/api/external/holidays?year=${year}`);
        if (!res.ok) throw new Error("Failed to fetch holidays");
        const data = await res.json();
        
        // Filter out past dates
        // Use local date for comparison to avoid timezone issues where "today" might be filtered out
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
        
        console.log("Filtering holidays from:", today);
        console.log("Total holidays fetched:", data.length);
        
        const futureHolidays = data.filter((h: Holiday) => h.date >= today);
        console.log("Future holidays:", futureHolidays.length);
        
        setHolidays(futureHolidays);

        // Pre-select all holidays (type === "Holiday") but not bridge days
        const holidayDates = futureHolidays
          .filter((h: Holiday) => h.type === "Holiday")
          .map((h: Holiday) => h.date);
          
        setSelectedDays(holidayDates);
      } catch (error) {
        console.error("Error loading holidays:", error);
        toast.error("Kunde inte hämta helgdagar");
      } finally {
        setLoading(false);
      }
    }

    fetchHolidays();
  }, []);

  const handleToggleDay = (date: string) => {
    setSelectedDays((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };

  const handleImport = async () => {
    if (selectedDays.length === 0) return;

    setSubmitting(true);
    try {
      // Process each selected day as a separate absence request
      const promises = selectedDays.map((dateStr) => {
        const day = holidays.find((h) => h.date === dateStr);
        return fetch("/api/absence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: new Date(dateStr),
            endDate: new Date(dateStr),
            type: "VACATION", // Using "VACATION" to match the enum value used in CreateAbsenceForm
            description: day?.name || "Ledighet",
            workspaceId,
          }),
        });
      });

      await Promise.all(promises);

      toast.success(`${selectedDays.length} dagar importerade som frånvaro`);
      setSelectedDays([]);
      router.refresh();
    } catch (error) {
      console.error("Error importing absences:", error);
      toast.error("Något gick fel vid importen");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (holidays.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Kommande Helg- & Klämdagar
        </CardTitle>
        <CardDescription>
          Välj dagar du vill markera som lediga. Röda dagar räknas oftast bort automatiskt, men klämdagar är bra att lägga in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {holidays.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {day.name}
                    {day.type === "Bridge" && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full dark:bg-amber-900 dark:text-amber-100">
                        Klämdag
                      </span>
                    )}
                    {day.type === "Holiday" && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-100">
                        Röd dag
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {format(new Date(day.date), "EEEE d MMMM yyyy", { locale: sv })}
                  </span>
                </div>
                <Checkbox
                  id={`day-${day.date}`}
                  checked={selectedDays.includes(day.date)}
                  onCheckedChange={() => handleToggleDay(day.date)}
                />
              </div>
            ))}
          </div>

          <Button 
            className="w-full" 
            onClick={handleImport} 
            disabled={selectedDays.length === 0 || submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Importera {selectedDays.length > 0 ? `(${selectedDays.length})` : ""}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
