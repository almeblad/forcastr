"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Pencil, Trash2, Loader2 } from "lucide-react";

type Assignment = {
  id: string;
  name: string;
  clientName: string;
  startDate: string; // ISO string from DB
  endDate: string;
  hourlyRate: number;
  allocationPercent: number;
};

export function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter();
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states for editing
  const [editEndDate, setEditEndDate] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [editAllocationPercent, setEditAllocationPercent] = useState("");

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete assignment");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Kunde inte ta bort uppdraget");
    } finally {
      setIsLoading(false);
      setDeletingId(null);
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditEndDate(assignment.endDate); // Assuming YYYY-MM-DD format from DB or valid date string
    setEditHourlyRate(assignment.hourlyRate.toString());
    setEditAllocationPercent(assignment.allocationPercent.toString());
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endDate: editEndDate,
          hourlyRate: parseInt(editHourlyRate),
          allocationPercent: parseInt(editAllocationPercent),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update assignment");
      }

      setEditingAssignment(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("Kunde inte uppdatera uppdraget");
    } finally {
      setIsLoading(false);
    }
  };

  if (assignments.length === 0) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
          <p>Inga uppdrag inlagda än.</p>
          <p className="text-sm">Börja med att lägga till en kund och sedan ett uppdrag.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{assignment.name}</h3>
                  <Badge variant="secondary">{assignment.clientName}</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {format(new Date(assignment.startDate), "d MMM yyyy", { locale: sv })} - {format(new Date(assignment.endDate), "d MMM yyyy", { locale: sv })}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right mr-4">
                  <div className="font-mono font-medium">{assignment.hourlyRate} SEK/h</div>
                  <div className="text-sm text-slate-500">{assignment.allocationPercent}% beläggning</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(assignment)}
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Detta kommer att ta bort uppdraget "{assignment.name}" permanent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(assignment.id)}
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                          {deletingId === assignment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ta bort"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera uppdrag</DialogTitle>
            <DialogDescription>
              Uppdatera detaljerna för uppdraget.
            </DialogDescription>
          </DialogHeader>
          
          {editingAssignment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-endDate" className="text-right">
                  Slutdatum
                </Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-hourlyRate" className="text-right">
                  Timpris
                </Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-allocation" className="text-right">
                  Beläggning (%)
                </Label>
                <Input
                  id="edit-allocation"
                  type="number"
                  min="0"
                  max="100"
                  value={editAllocationPercent}
                  onChange={(e) => setEditAllocationPercent(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAssignment(null)} disabled={isLoading}>
              Avbryt
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara ändringar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
