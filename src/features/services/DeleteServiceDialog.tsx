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
import type { Service } from "./types";

type DeleteServiceDialogProps = {
  service: Service | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting?: boolean;
};

export function DeleteServiceDialog({
  service,
  onOpenChange,
  onConfirm,
  deleting,
}: DeleteServiceDialogProps) {
  return (
    <AlertDialog open={!!service} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa dịch vụ</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa dịch vụ{" "}
            <span className="font-medium text-foreground">{service?.name}</span>? Dịch vụ sẽ
            được ẩn khỏi danh sách (xóa mềm).
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
