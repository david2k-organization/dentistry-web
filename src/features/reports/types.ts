/** Số liệu tổng quan tháng hiện tại — `GET /reports/overview`. */
export type ReportOverview = {
  countNewPatients: number;
  countCompletedAppointments: number;
  /** Tổng tiền đã thu (gross) trong tháng, VND. */
  revenue: number;
};

/** Một tháng trong `GET /reports/revenue-last-6-months`. */
export type MonthlyRevenue = {
  /** Mốc 00:00 ngày đầu tháng (ISO datetime). */
  month: string;
  /** Tổng tiền đã thu trong tháng đó, VND. */
  revenue: number;
};

/** Một ngày trong `GET /reports/revenue-last-7-days`. */
export type DailyRevenue = {
  /** Mốc 00:00 đầu ngày (ISO datetime). */
  day: string;
  /** Tổng tiền đã thu trong ngày đó, VND. */
  revenue: number;
};

/** Một dịch vụ trong `GET /reports/top-5-services`. */
export type TopService = {
  serviceId: string;
  serviceName: string;
  /** Tiền đã thu thực tế (net) phân bổ cho dịch vụ, VND. */
  revenue: number;
};
