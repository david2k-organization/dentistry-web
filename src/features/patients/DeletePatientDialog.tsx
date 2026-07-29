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
    <Dialog open={!!patient} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-[#fbeeea] text-[#a4553a]">
          <Trash2 className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Xoá hồ sơ {patient?.fullName}?</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            Toàn bộ thông tin và ghi chú của hồ sơ này sẽ bị xoá. Hành động này không thể hoàn
            tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <Button
            className="bg-[#a4553a] text-white hover:bg-[#8a4530]"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Đang xoá..." : "Xoá hồ sơ"}
          </Button>
          <Button variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>
            Giữ lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
