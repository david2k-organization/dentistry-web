# Patients — Import & Export Excel API

Tài liệu cho 3 endpoint: tải template, import từ Excel, export ra Excel.

- **Base URL:** `/api/v1`
- **Auth:** Bearer token (header `Authorization: Bearer <access_token>`).
- **Phân quyền:** mỗi endpoint gắn một permission key; tài khoản gọi phải có quyền tương ứng.

| Method | Path                       | Permission key     | Mô tả                         |
| ------ | -------------------------- | ------------------ | ----------------------------- |
| GET    | `/patient/import/template` | `patient.template` | Tải file Excel mẫu để nhập    |
| POST   | `/patient/import`          | `patient.import`   | Import bệnh nhân từ file Excel |
| GET    | `/patient/export`          | `patient.export`   | Xuất danh sách bệnh nhân       |

> Mọi response JSON đều được bọc trong envelope chuẩn của hệ thống:
> ```json
> {
>   "success": true,
>   "statusCode": 200,
>   "message": "Success",
>   "data": <payload>,
>   "timestamp": "2026-08-17T09:00:00.000Z",
>   "path": "/api/v1/patient/import"
> }
> ```
> Riêng 2 endpoint trả **file** (`template`, `export`) không dùng envelope — chúng trả trực tiếp binary `.xlsx` qua `StreamableFile`.

> **CORS:** server đã bật `Access-Control-Expose-Headers: Content-Disposition` nên FE cross-origin đọc được tên file từ header khi tải xuống.

---

## 1. Tải template — `GET /patient/import/template`

Trả về file Excel mẫu gồm 1 sheet `Template`: dòng 1 là header, dòng 2 là ví dụ. Dùng đúng file này để điền rồi import nhằm tránh sai định dạng cột.

**Request**

```http
GET /api/v1/patient/import/template
Authorization: Bearer <access_token>
```

**Response `200 OK`**

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="patient-import-template.xlsx"`
- Body: nội dung file `.xlsx`.

Các cột trong template (thứ tự trái → phải):

| Header (trên file) | Bắt buộc | Ví dụ                |
| ------------------ | -------- | -------------------- |
| Họ tên             | ✅       | Nguyễn Văn A         |
| Số điện thoại      | ❌       | 0901234567           |
| Email              | ❌       | a.nguyen@example.com |
| Ngày sinh          | ❌       | 1990-05-20           |
| Giới tính          | ❌       | Nam                  |
| Ghi chú            | ❌       |                      |

---

## 2. Import — `POST /patient/import`

Đọc file Excel, validate **từng dòng độc lập**, ghi các dòng hợp lệ và trả về báo cáo các dòng lỗi (kiểu *partial*: một dòng lỗi không chặn các dòng còn lại).

**Request**

- `Content-Type: multipart/form-data`
- Field file: **`file`** (1 file `.xlsx` / `.xls`, tối đa **10MB**, tối đa **5000 dòng dữ liệu**).

```http
POST /api/v1/patient/import
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file=@patients.xlsx
```

```bash
curl -X POST "http://localhost:3000/api/v1/patient/import" \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@patients.xlsx"
```

### Quy tắc cột & chuẩn hoá dữ liệu

Header được so khớp **không phân biệt hoa thường / khoảng trắng thừa**. Cột không khớp header nào sẽ bị bỏ qua.

| Cột           | Field       | Ràng buộc                                                                    |
| ------------- | ----------- | ---------------------------------------------------------------------------- |
| Họ tên        | fullName    | Bắt buộc, 1–255 ký tự                                                         |
| Số điện thoại | phone       | Tuỳ chọn, ≤ 20 ký tự, **duy nhất**. Ô dạng số được tự chuyển thành chuỗi      |
| Email         | email       | Tuỳ chọn, email hợp lệ, ≤ 255 ký tự, **duy nhất**                             |
| Ngày sinh     | dateOfBirth | Tuỳ chọn. Nhận ô ngày của Excel hoặc chuỗi `YYYY-MM-DD`                       |
| Giới tính     | gender      | Tuỳ chọn. `Nam`→MALE, `Nữ`→FEMALE, `Khác`→OTHER (cũng nhận MALE/FEMALE/OTHER) |
| Ghi chú       | notes       | Tuỳ chọn, ≤ 2000 ký tự                                                        |

### Chống trùng

- **Trong file:** hai dòng cùng `phone` hoặc cùng `email` → dòng thứ hai bị đánh lỗi.
- **Với DB:** `phone`/`email` đã tồn tại trong hệ thống → dòng đó bị đánh lỗi.

Dòng hợp lệ được insert; mỗi bệnh nhân mới được tự khởi tạo sơ đồ răng mặc định.

**Response `201 Created`** — `data` là `ImportResult`:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {
    "total": 4,
    "success": 2,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "errors": ["fullName: Required"],
        "data": { "phone": "0900000003", "email": "c@example.com" }
      },
      {
        "row": 5,
        "errors": ["Số điện thoại \"0901234567\" đã tồn tại"],
        "data": { "fullName": "Trần B", "phone": "0901234567" }
      }
    ]
  },
  "timestamp": "2026-08-17T09:00:00.000Z",
  "path": "/api/v1/patient/import"
}
```

| Trường            | Kiểu     | Ý nghĩa                                                          |
| ----------------- | -------- | --------------------------------------------------------------- |
| `total`           | number   | Tổng số dòng dữ liệu đọc được (không tính header, bỏ dòng trống) |
| `success`         | number   | Số dòng insert thành công                                       |
| `failed`          | number   | Số dòng lỗi                                                     |
| `errors[].row`    | number   | Số dòng trên file Excel (bắt đầu từ 2) để dò đúng vị trí         |
| `errors[].errors` | string[] | Danh sách lý do lỗi của dòng đó                                 |
| `errors[].data`   | object   | Dữ liệu thô đã đọc của dòng đó                                  |

### Lỗi cấp file (không phải cấp dòng)

| HTTP | Trường hợp                                      | Message                                        |
| ---- | ----------------------------------------------- | ---------------------------------------------- |
| 422  | Thiếu file / sai định dạng (không phải xlsx/xls) | (từ `ParseFilePipe`)                            |
| 422  | File > 10MB                                      | (từ `ParseFilePipe`)                            |
| 400  | File hỏng / không đọc được                       | `File Excel không hợp lệ hoặc bị hỏng`          |
| 400  | Sheet không có dòng dữ liệu                      | `File Excel không có dữ liệu`                   |
| 400  | Không tìm thấy cột hợp lệ nào                    | `Không tìm thấy cột hợp lệ. Header mong đợi: …` |
| 400  | Vượt quá 5000 dòng                              | `File vượt quá 5000 dòng (hiện có N)`           |
| 401  | Thiếu / sai token                               | —                                              |
| 403  | Không có quyền `patient.import`                 | —                                              |

---

## 3. Export — `GET /patient/export`

Xuất danh sách bệnh nhân ra file Excel (1 sheet `Patients`). Có thể lọc theo từ khoá tên.

**Query params**

| Param       | Kiểu    | Bắt buộc | Mặc định | Mô tả                                                                        |
| ----------- | ------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `searchKey` | string  | ❌       | —        | Lọc theo `fullName` (chứa, không phân biệt hoa thường)                       |
| `stream`    | boolean | ❌       | `false`  | `true` → xuất theo kiểu **streaming** (đọc dữ liệu theo lô, RAM thấp, hợp file lớn) |

> - **Mặc định (`stream` bỏ trống hoặc khác `true`)**: build toàn bộ file trong RAM rồi trả về. Giới hạn tối đa **10.000** bản ghi/lần. Hợp với dữ liệu vừa phải, nhanh gọn.
> - **`stream=true`**: ghi file theo từng dòng và stream dần về client (lấy dữ liệu theo lô 1000 bản ghi). RAM ổn định, byte đầu tiên về sớm, không giới hạn cứng 10.000 — thích hợp khi số bản ghi lớn.
> - Kết quả (nội dung file, các cột) của hai chế độ **giống hệt nhau**; chỉ khác cách sinh & truyền file.
> - Các tham số phân trang (`page`, `pageSize`) nếu truyền sẽ bị bỏ qua.

**Request — chế độ mặc định (buffer)**

```http
GET /api/v1/patient/export?searchKey=nguyen
Authorization: Bearer <access_token>
```

**Request — chế độ streaming**

```http
GET /api/v1/patient/export?stream=true
Authorization: Bearer <access_token>
```

```bash
# Buffer (mặc định)
curl -X GET "http://localhost:3000/api/v1/patient/export?searchKey=nguyen" \
  -H "Authorization: Bearer <access_token>" \
  -o patients.xlsx

# Streaming (dữ liệu lớn)
curl -X GET "http://localhost:3000/api/v1/patient/export?stream=true" \
  -H "Authorization: Bearer <access_token>" \
  -o patients.xlsx
```

**Response `200 OK`** (cho cả hai chế độ)

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="patients-<HHmmssddMMyyyy>.xlsx"`
  - Hậu tố theo **giờ phút giây ngày tháng năm**, vd `patients-10451708082026.xlsx`.
- Body: nội dung file `.xlsx`.

Các cột trong file xuất:

| Header        | Nguồn       | Định dạng                    |
| ------------- | ----------- | ---------------------------- |
| Họ tên        | fullName    | text                         |
| Số điện thoại | phone       | text (rỗng nếu không có)     |
| Email         | email       | text (rỗng nếu không có)     |
| Ngày sinh     | dateOfBirth | `YYYY-MM-DD` (rỗng nếu null) |
| Giới tính     | gender      | Nam / Nữ / Khác              |
| Ghi chú       | notes       | text                         |
| Ngày tạo      | createdAt   | `YYYY-MM-DD HH:mm`           |

**Lỗi**

| HTTP | Trường hợp                      |
| ---- | ------------------------------- |
| 401  | Thiếu / sai token               |
| 403  | Không có quyền `patient.export` |

---

## Ghi chú tích hợp

- Các permission `patient.template`, `patient.import`, `patient.export` được **tự đồng bộ** vào bảng permission khi khởi động app (với `SYNC_PERMISSIONS=true`); nhớ **gán quyền cho role** phù hợp (vd lễ tân/admin).
- Import → export là cặp đối xứng: file export dùng lại đúng nhãn tiếng Việt (`Nam/Nữ/Khác`, ngày `YYYY-MM-DD`) nên có thể chỉnh sửa rồi import lại (các cột thừa như `Ngày tạo` sẽ bị bỏ qua khi import).
- FE tải file: gọi bằng client có gửi Bearer token (`fetch` + blob), đọc tên file từ header `Content-Disposition` (đã được expose qua CORS). Mở thẳng URL trên trình duyệt sẽ bị `401` vì không kèm token.
