import { AxiosError } from "axios";

export const vnd = new Intl.NumberFormat("vi-VN");
export const fmt = (n: number) => `${vnd.format(n)} đ`;

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
};

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
};

export const errMessage = (err: unknown, fallback: string) =>
  (err instanceof AxiosError
    ? (err.response?.data as { message?: string } | undefined)?.message
    : undefined) ?? fallback;
