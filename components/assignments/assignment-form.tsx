"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Client = {
  id: string;
  name: string;
};

interface AssignmentFormProps {
  workspaceId: string;
  clients: Client[];
  onSuccess?: () => void;
}

export function AssignmentForm({ workspaceId, clients, onSuccess }: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [hourlyRate, setHourlyRate] = useState("1200");
  const [allocation, setAllocation] = useState("100");
  const [hasBroker, setHasBroker] = useState(false);
  const [brokerFee, setBrokerFee] = useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !clientId) return;

    setLoading(true);
    try {
      const brokerFeePercent = hasBroker ? Number(brokerFee) : 0;
      await fetch("/api/assignments", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          clientId,
          name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          hourlyRate: Number(hourlyRate),
          allocationPercent: Number(allocation),
          brokerFeePercent,
        }),
      });
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Kund</Label>
        <Select onValueChange={setClientId} value={clientId}>
          <SelectTrigger>
            <SelectValue placeholder="Välj kund" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Uppdragsnamn</Label>
        <Input 
          id="project"
          placeholder="T.ex. Fullstack utvecklare"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label>Startdatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "pl-3 text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? format(startDate, "PPP") : <span>Välj datum</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Slutdatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "pl-3 text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? format(endDate, "PPP") : <span>Välj datum</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rate">Timpris (SEK)</Label>
          <Input 
            id="rate" 
            type="number" 
            value={hourlyRate} 
            onChange={(e) => setHourlyRate(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="allocation">Beläggning (%)</Label>
          <Input 
            id="allocation" 
            type="number" 
            max="100"
            value={allocation} 
            onChange={(e) => setAllocation(e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4 bg-slate-50">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="broker" 
            checked={hasBroker}
            onCheckedChange={(checked) => {
              setHasBroker(checked === true);
              if (checked === true && brokerFee === "0") {
                setBrokerFee("17"); // Default suggestion if checked
              }
            }}
          />
          <Label htmlFor="broker" className="font-medium cursor-pointer">
            Jag har en mellanhand (paraply/mäklare)
          </Label>
        </div>

        {hasBroker && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="brokerFee">Avgift (%)</Label>
            <div className="relative">
              <Input 
                id="brokerFee" 
                type="number" 
                min="0"
                max="100"
                step="0.1"
                value={brokerFee} 
                onChange={(e) => setBrokerFee(e.target.value)} 
                required={hasBroker}
              />
              <span className="absolute right-3 top-2.5 text-slate-500 text-sm">%</span>
            </div>
            <p className="text-xs text-slate-500">
              Ditt timpris reduceras med denna procentsats i beräkningarna.
            </p>
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sparar..." : "Spara uppdrag"}
      </Button>
    </form>
  );
}
