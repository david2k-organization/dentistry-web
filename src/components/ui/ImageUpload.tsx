import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ImageUploadProps = {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  /**
   * Nếu truyền, mỗi ảnh chọn sẽ được upload ngay qua hàm này và lưu URL trả về
   * (thay vì nhúng base64 data URL). Dùng cho luồng presigned URL lên S3.
   */
  uploadFile?: (file: File) => Promise<string>;
};

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("empty"));
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  max = 1,
  maxSizeMB = 5,
  disabled,
  className,
  uploadFile,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const remaining = max - value.length;
  const canAdd = !disabled && !uploading && remaining > 0;

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const maxBytes = maxSizeMB * 1024 * 1024;
    const accepted: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" không phải là tệp ảnh.`);
        continue;
      }
      if (file.size > maxBytes) {
        toast.error(`"${file.name}" vượt quá ${maxSizeMB}MB.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    if (accepted.length > remaining) {
      toast.error(`Chỉ có thể tải lên tối đa ${max} ảnh.`);
    }

    const toAdd = accepted.slice(0, remaining);
    if (uploadFile) {
      setUploading(true);
      try {
        const urls = await Promise.all(toAdd.map(uploadFile));
        onChange([...value, ...urls]);
      } catch {
        toast.error("Không thể tải ảnh lên.");
      } finally {
        setUploading(false);
      }
      return;
    }

    try {
      const urls = await Promise.all(toAdd.map(readAsDataURL));
      onChange([...value, ...urls]);
    } catch {
      toast.error("Không thể đọc ảnh.");
    }
  };

  const removeAt = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const showPrev = () =>
    setPreviewIndex((i) => (i == null ? i : (i - 1 + value.length) % value.length));
  const showNext = () =>
    setPreviewIndex((i) => (i == null ? i : (i + 1) % value.length));

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={handlePick}
        disabled={disabled}
      />

      <div className={cn("flex flex-wrap gap-2.5", className)}>
        {value.map((src, index) => (
          <div key={index} className="group relative size-24">
            <button
              type="button"
              onClick={() => setPreviewIndex(index)}
              className="relative size-full overflow-hidden rounded-lg border border-input outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
              aria-label="Xem ảnh"
            >
              <img
                src={src}
                alt={`Ảnh ${index + 1}`}
                className="size-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Eye className="size-5" />
              </span>
            </button>
            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Gỡ ảnh"
                className="absolute -right-2 -top-2 size-6 rounded-full bg-background text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                onClick={() => removeAt(index)}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-muted-foreground outline-none transition-colors hover:border-ring hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ImagePlus className="size-5" />
            <span className="text-[12px]">Tải ảnh</span>
          </button>
        )}

        {uploading && (
          <div className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-[12px]">Đang tải…</span>
          </div>
        )}
      </div>

      <Dialog
        open={previewIndex != null}
        onOpenChange={(open) => !open && setPreviewIndex(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
          {previewIndex != null && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={value[previewIndex]}
                alt={`Ảnh ${previewIndex + 1}`}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
              {value.length > 1 && (
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Ảnh trước"
                    onClick={showPrev}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-[12.5px] tabular-nums text-muted-foreground">
                    {previewIndex + 1} / {value.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Ảnh sau"
                    onClick={showNext}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
