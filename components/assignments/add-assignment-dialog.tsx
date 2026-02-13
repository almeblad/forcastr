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
import { AssignmentForm } from "@/components/assignments/assignment-form";

type Client = {
    id: string;
    name: string;
};

export function AddAssignmentDialog({ workspaceId, clients }: { workspaceId: string, clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
      return <Button><Plus className="w-4 h-4 mr-2" /> Nytt Uppdrag</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Nytt Uppdrag</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skapa nytt uppdrag</DialogTitle>
        </DialogHeader>
        <AssignmentForm 
            workspaceId={workspaceId} 
            clients={clients} 
            onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
