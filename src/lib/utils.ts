import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Nút hành động dạng icon vuông bo góc dùng trong các bảng danh sách (Bệnh nhân, Dịch vụ, ...). */
export function iconActionButtonClass(variant: "default" | "danger" = "default") {
  const base =
    "grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-border bg-card text-[#4a6664] transition-colors"
  return variant === "danger"
    ? `${base} hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]`
    : `${base} hover:border-[#cfe0df] hover:bg-accent hover:text-primary`
}
