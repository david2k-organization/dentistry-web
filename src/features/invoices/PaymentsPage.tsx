import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { ChooseInvoiceDialog } from "./ChooseInvoiceDialog";
import { EditPaymentDialog, type EditPaymentResult } from "./EditPaymentDialog";
import { errMessage } from "./format";
import { createPaymentColumns } from "./payment-columns";
import { PaymentDialog } from "./PaymentDialog";
import { RefundPaymentDialog } from "./RefundPaymentDialog";
import { getPayments, refundPayment, updatePayment } from "./payments-api";
import type { Payment, RefundPaymentInput } from "./payment-types";
import { getOrder, getOrders } from "./api";
import { isPayable, type Order } from "./types";

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [chooseOpen, setChooseOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const [savingRefund, setSavingRefund] = useState(false);

  const orderMap = useMemo(() => {
    const map: Record<string, Order> = {};
    for (const o of orders) map[o.id] = o;
    return map;
  }, [orders]);

  const payableInvoices = useMemo(() => orders.filter(isPayable), [orders]);

  const loadPayments = useCallback(
    async (params: { pageIndex: number; pageSize: number }) => {
      setLoading(true);
      try {
        const { data, meta } = await getPayments({
          page: params.pageIndex + 1,
          pageSize: params.pageSize,
        });
        setPayments(data);
        setTotal(meta.total);
      } catch (err) {
        toast.error(errMessage(err, "Không thể tải danh sách phiếu thu."));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Nạp hoá đơn một lần để tra cứu mã HĐ / bệnh nhân và lọc HĐ có thể thu.
  useEffect(() => {
    let active = true;
    getOrders({ pageSize: 200 })
      .then((page) => {
        if (active) setOrders(page.data);
      })
      .catch(() => {
        if (active) toast.error("Không thể tải danh sách hoá đơn.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadPayments({ pageIndex, pageSize }));
  }, [loadPayments, pageIndex, pageSize]);

  const columns = useMemo(
    () =>
      createPaymentColumns(orderMap, {
        onEdit: setEditing,
        onRefund: setRefunding,
      }),
    [orderMap],
  );

  // Sau khi tạo phiếu thu: cập nhật lại trạng thái hoá đơn và nạp lại danh sách.
  const handleRecorded = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setPayingInvoice(null);
    loadPayments({ pageIndex, pageSize });
  };

  const handleConfirmRefund = async (input: RefundPaymentInput) => {
    if (!refunding) return;
    setSavingRefund(true);
    try {
      const created = await refundPayment(refunding.id, input);
      toast.success(`Đã tạo phiếu hoàn tiền ${created.code}`);
      setRefunding(null);
      // Hoàn tiền làm giảm net đã thu → nạp lại phiếu + trạng thái hoá đơn.
      loadPayments({ pageIndex, pageSize });
      const updatedOrder = await getOrder(refunding.invoiceId);
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
        );
      }
    } catch (err) {
      toast.error(errMessage(err, "Không thể hoàn tiền."));
    } finally {
      setSavingRefund(false);
    }
  };

  const handleSaveEdit = async (result: EditPaymentResult) => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const updated = await updatePayment(editing.id, {
        amount: result.amount,
        method: result.method,
        note: result.note,
      });
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`Đã cập nhật phiếu thu ${updated.code}`);
      setEditing(null);
    } catch (err) {
      toast.error(errMessage(err, "Không thể cập nhật phiếu thu."));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        getRowId={(row) => row.id}
        title="Phiếu thu"
        countLabel={(n) => `${n} phiếu`}
        emptyMessage="Chưa có phiếu thu nào."
        manualPagination={{
          pageIndex,
          pageSize,
          total,
          onPaginationChange: ({ pageIndex: nextIndex, pageSize: nextSize }) => {
            setPageIndex(nextSize !== pageSize ? 0 : nextIndex);
            setPageSize(nextSize);
          },
        }}
        actions={
          <Button className="gap-1.5" onClick={() => setChooseOpen(true)}>
            <Wallet className="size-[17px]" />
            Tạo phiếu thu
          </Button>
        }
      />

      <ChooseInvoiceDialog
        open={chooseOpen}
        onOpenChange={setChooseOpen}
        invoices={payableInvoices}
        onPick={(invoice) => {
          setChooseOpen(false);
          setPayingInvoice(invoice);
        }}
      />

      <PaymentDialog
        invoice={payingInvoice}
        onOpenChange={(open) => !open && setPayingInvoice(null)}
        onRecorded={handleRecorded}
      />

      <EditPaymentDialog
        payment={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />

      <RefundPaymentDialog
        payment={refunding}
        onOpenChange={(open) => !open && setRefunding(null)}
        onConfirm={handleConfirmRefund}
        refunding={savingRefund}
      />
    </div>
  );
}
