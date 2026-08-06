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
import type { Supply } from "./types";

type DeleteSupplyDialogProps = {
  supply: Supply | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting?: boolean;
};

export function DeleteSupplyDialog({
  supply,
  onOpenChange,
  onConfirm,
  deleting,
}: DeleteSupplyDialogProps) {
  return (
    <AlertDialog open={!!supply} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa vật tư</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa vật tư{" "}
            <span className="font-medium text-foreground">{supply?.name}</span> ({supply?.code})?
            Thao tác này không thể hoàn tác.
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
