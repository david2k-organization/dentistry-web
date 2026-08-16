# Payments API

Base path: `/payments`

All endpoints require a valid access token (`Authorization: Bearer <token>`) — the app applies a global `AuthenticationGuard`. `receivedById` / `voidedById` are always taken from the authenticated user, never from the request body.

## Response envelope

Every response is wrapped by the global `TransformInterceptor` / exception filters.

Success:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* endpoint payload, see below */ },
  "timestamp": "2026-08-15T10:00:00.000Z",
  "path": "/payments"
}
```

Error:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Không tìm thấy phiếu thu",
  "data": null
}
```

Validation errors (Zod, invalid body/query) return `422` with an `errors` array of `{ field, message }`.

## Payment object

```jsonc
{
  "id": "string (cuid)",
  "code": "string",              // server-generated, e.g. "PAY-3F7K9QRT"
  "invoiceId": "string",
  "amount": "12000000",          // Decimal(12,0), serialized as string
  "method": "CASH | BANK_TRANSFER",
  "paidAt": "2026-08-15T10:00:00.000Z",
  "isRefund": false,
  "refundReason": "string | null",
  "note": "string | null",
  "receivedById": "string",
  "voidedAt": "2026-08-15T10:00:00.000Z | null",
  "voidedById": "string | null",
  "voidedReason": "string | null",
  "createdAt": "2026-08-15T10:00:00.000Z",
  "updatedAt": "2026-08-15T10:00:00.000Z"
}
```

## Side effect: invoice status sync

`create`, `update`, `void`, and `refund` all recompute the invoice's **net paid amount** (sum of non-voided payments minus non-voided refunds) and sync `Invoice.status` afterward:

| Net paid vs. `totalAmount` | Status            |
| --------------------------- | ----------------- |
| `netPaid <= 0`               | `ISSUED`          |
| `0 < netPaid < totalAmount`  | `PARTIALLY_PAID`  |
| `netPaid >= totalAmount`     | `PAID`            |

Invoices in `DRAFT` or `VOIDED` are never touched by this sync.

---

## `POST /payments` — create a payment

### Body

| Field       | Type              | Required | Notes                                  |
| ----------- | ----------------- | -------- | --------------------------------------- |
| `invoiceId` | `string`          | yes      | Must reference an existing invoice      |
| `amount`    | `number` (> 0)    | yes      |                                          |
| `method`    | `CASH \| BANK_TRANSFER` | yes | |
| `paidAt`    | `date`             | no       | Defaults to now                         |
| `note`      | `string`           | no       |                                          |

`code` and `receivedById` are set by the server and cannot be supplied by the client.

### Business rules

- 404 `Không tìm thấy hóa đơn` — `invoiceId` doesn't exist.
- 400 `Không thể thu tiền cho hóa đơn ở trạng thái này` — invoice is `DRAFT` or `VOIDED`.

### Response

`201` with the created payment object. Triggers invoice status sync.

---

## `GET /payments` — list payments (paginated)

### Query

| Field       | Type      | Required | Default | Notes                          |
| ----------- | --------- | -------- | ------- | ------------------------------- |
| `page`      | `number`  | no       | `1`     | min `1`                         |
| `pageSize`  | `number`  | no       | `10`    | min `1`, max `200`              |
| `invoiceId` | `string`  | no       |         | filter payments of one invoice  |

### Response

```jsonc
{
  "data": [ /* Payment[] */ ],
  "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 }
}
```

Results are ordered by `createdAt desc`.

---

## `PUT /payments/:id` — update a payment

Edits basic payment info before it's voided. Does **not** touch `code`, `invoiceId`, `isRefund`, `refundReason`, or the `voided*` fields — those are only managed by the dedicated void/refund endpoints.

### Body (all optional)

| Field         | Type     | Notes |
| ------------- | -------- | ----- |
| `amount`      | `number` |       |
| `method`      | `CASH \| BANK_TRANSFER` | |
| `paidAt`      | `date`   |       |
| `note`        | `string` |       |
| `receivedById`| `string` |       |

### Business rules

- 404 `Không tìm thấy phiếu thu` — payment doesn't exist.
- 409 `Không thể cập nhật phiếu thu đã hủy` — payment is already voided.

### Response

`200` with the updated payment object. Triggers invoice status sync.

---

## `POST /payments/:id/void` — void a payment

Marks the payment as voided so it stops counting toward the invoice's paid total. `voidedById` is the authenticated user.

### Body

| Field          | Type              | Required | Notes            |
| -------------- | ----------------- | -------- | ----------------- |
| `voidedReason` | `string` (min 1)  | yes      |                    |

### Business rules

- 404 `Không tìm thấy phiếu thu` — payment doesn't exist.
- 409 `Phiếu thu đã được hủy trước đó` — already voided.

### Response

`201` with the voided payment object (`voidedAt`, `voidedById`, `voidedReason` populated). Triggers invoice status sync.

---

## `POST /payments/:id/refund` — refund a payment

`:id` is the **original** payment being refunded. This does not mutate that payment — it creates a **new** `Payment` row with `isRefund: true` on the same invoice, so a payment can be partially or repeatedly refunded. `receivedById` on the new row is the authenticated user processing the refund.

### Body

| Field          | Type                    | Required | Notes                                                        |
| -------------- | ----------------------- | -------- | -------------------------------------------------------------- |
| `amount`       | `number` (> 0)          | yes      | Must not exceed the invoice's current net paid amount          |
| `refundReason` | `string` (min 1)        | yes      |                                                                  |
| `note`         | `string`                | no       |                                                                  |
| `method`       | `CASH \| BANK_TRANSFER` | no       | Defaults to the original payment's method                      |

### Business rules

- 404 `Không tìm thấy phiếu thu` — original payment doesn't exist.
- 409 `Không thể hoàn tiền phiếu thu đã hủy` — original payment is voided.
- 400 `Không thể hoàn tiền cho một phiếu hoàn tiền` — original payment is itself a refund (`isRefund: true`).
- 400 `Số tiền hoàn vượt quá số tiền đã thanh toán của hóa đơn` — `amount` exceeds the invoice's net paid amount.

### Response

`201` with the newly created refund payment object. Triggers invoice status sync.
