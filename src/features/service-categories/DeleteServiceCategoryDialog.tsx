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
import type { ServiceCategory } from "./types";

type DeleteServiceCategoryDialogProps = {
  category: ServiceCategory | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting?: boolean;
};

export function DeleteServiceCategoryDialog({
  category,
  onOpenChange,
  onConfirm,
  deleting,
}: DeleteServiceCategoryDialogProps) {
  return (
    <AlertDialog open={!!category} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa danh mục dịch vụ</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa danh mục{" "}
            <span className="font-medium text-foreground">{category?.name}</span>? Hành động này
            không thể hoàn tác.
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
