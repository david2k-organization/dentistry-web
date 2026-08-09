import type { Notification } from "./types";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "appointment",
    title: "Lịch hẹn mới",
    description: "Nguyễn Văn An vừa đặt lịch khám lúc 14:30 hôm nay.",
    createdAt: minutesAgo(4),
    read: false,
  },
  {
    id: "2",
    type: "inventory",
    title: "Vật tư sắp hết",
    description: "Găng tay y tế (size M) chỉ còn 8 hộp trong kho.",
    createdAt: minutesAgo(32),
    read: false,
  },
  {
    id: "3",
    type: "invoice",
    title: "Hóa đơn chưa thanh toán",
    description: "Hóa đơn #INV-2024-0187 của Trần Thị Bình đã quá hạn 2 ngày.",
    createdAt: minutesAgo(58),
    read: false,
  },
  {
    id: "4",
    type: "patient",
    title: "Bệnh nhân mới",
    description: "Lê Hoàng Cường vừa được thêm vào hồ sơ bệnh nhân.",
    createdAt: minutesAgo(130),
    read: true,
  },
  {
    id: "5",
    type: "appointment",
    title: "Lịch hẹn bị hủy",
    description: "Phạm Thị Dung đã hủy lịch hẹn lúc 09:00 ngày mai.",
    createdAt: minutesAgo(200),
    read: true,
  },
  {
    id: "6",
    type: "system",
    title: "Cập nhật hệ thống",
    description: "Hệ thống sẽ bảo trì từ 23:00 - 01:00 đêm nay.",
    createdAt: minutesAgo(720),
    read: true,
  },
];
