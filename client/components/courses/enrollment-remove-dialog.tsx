import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EnrollmentRemoveDialogProps {
  removeDialogOpen: boolean;
  setRemoveDialogOpen: (open: boolean) => void;
  selectedStudents: string[];
  handleRemoveStudents: () => void;
  isLoading: boolean;
}

export function EnrollmentRemoveDialog({
  removeDialogOpen,
  setRemoveDialogOpen,
  selectedStudents,
  handleRemoveStudents,
  isLoading,
}: EnrollmentRemoveDialogProps) {
  return (
    <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Students</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {selectedStudents.length} student
            {selectedStudents.length !== 1 ? "s" : ""} from this course? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemoveStudents} disabled={isLoading}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
