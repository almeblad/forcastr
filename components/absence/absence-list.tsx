"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Trash2 } from "lucide-react";
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
import { useState } from "react";

type Absence = {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  description: string | null;
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "VACATION": return "Semester";
    case "SICK": return "Sjukdom";
    case "VAB": return "VAB";
    case "OTHER": return "Annat";
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "VACATION": return "bg-blue-100 text-blue-800";
    case "SICK": return "bg-red-100 text-red-800";
    case "VAB": return "bg-orange-100 text-orange-800";
    default: return "bg-slate-100 text-slate-800";
  }
};

export function AbsenceList({ absences }: { absences: Absence[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await fetch(`/api/absence/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (absences.length === 0) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
          <p>Ingen frånvaro registrerad.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {absences.map((absence) => (
        <Card key={absence.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(absence.type)}`}>
                  {getTypeLabel(absence.type)}
                </span>
                {absence.description && (
                  <span className="text-sm font-medium">{absence.description}</span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {format(new Date(absence.startDate), "d MMM", { locale: sv })} - {format(new Date(absence.endDate), "d MMM yyyy", { locale: sv })}
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta kommer att ta bort frånvaroposten permanent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDelete(absence.id)}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    {deletingId === absence.id ? "Tar bort..." : "Ta bort"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
