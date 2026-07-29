import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Patient } from "./types";

type DeletePatientDialogProps = {
  patient: Patient | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting?: boolean;
};

export function DeletePatientDialog({
  patient,
  onOpenChange,
  onConfirm,
  deleting,
}: DeletePatientDialogProps) {
  return (
    <AlertDialog open={!!patient} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa bệnh nhân</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa bệnh nhân{" "}
            <span className="font-medium text-foreground">{patient?.fullName}</span>?
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {deleting ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
