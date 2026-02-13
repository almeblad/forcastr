"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/assignments/client-form";

export function AddClientDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
      return <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Ny Kund</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Ny Kund</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till ny kund</DialogTitle>
        </DialogHeader>
        <ClientForm 
            workspaceId={workspaceId} 
            onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
