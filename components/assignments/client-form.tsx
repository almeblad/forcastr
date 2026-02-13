"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ClientFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export function ClientForm({ workspaceId, onSuccess }: ClientFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({ workspaceId, name }),
      });
      router.refresh();
      setName("");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Företagsnamn</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          placeholder="T.ex. Volvo IT"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sparar..." : "Spara kund"}
      </Button>
    </form>
  );
}
