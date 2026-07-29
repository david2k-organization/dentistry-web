export type InvoiceLine = { name: string; qty: number; price: number };

export type Invoice = {
  code: string;
  patient: string;
  date: string;
  paid: boolean;
  voided: boolean;
  reason?: string;
  lines: InvoiceLine[];
};

export function invoiceTotal(invoice: Invoice): number {
  return invoice.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}
