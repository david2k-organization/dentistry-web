import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Role } from "./types";

type DeleteRoleDialogProps = {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting?: boolean;
};

export function DeleteRoleDialog({ role, onOpenChange, onConfirm, deleting }: DeleteRoleDialogProps) {
  return (
    <Dialog open={!!role} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-[#fbeeea] text-[#a4553a]">
          <Trash2 className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Xoá vai trò {role?.name}?</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            Vai trò sẽ chuyển sang trạng thái tạm khoá và không còn hiển thị trong danh sách. Nhân
            sự đang được gán vai trò này sẽ vẫn giữ nguyên liên kết — cần đổi vai trò cho họ theo
            cách thủ công. Hành động này không thể hoàn tác qua giao diện.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <Button
            className="bg-[#a4553a] text-white hover:bg-[#8a4530]"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Đang xoá..." : "Xoá vai trò"}
          </Button>
          <Button variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>
            Giữ lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
