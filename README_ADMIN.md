# RobloxShop - Admin Dashboard

Dashboard quản trị gồm:

- Tổng quan: số user, dịch vụ, đơn hàng, giao dịch nạp tiền, doanh thu.
- Dịch vụ: thêm, sửa, ẩn/hiện, xóa.
- Đơn hàng: xem chi tiết và đổi `pending / processing / completed / cancelled`.
- Khi hủy đơn, số tiền đơn được hoàn lại cho user một lần.
- Nạp tiền: xem giao dịch và `Duyệt / Từ chối`. Khi duyệt, tiền tự cộng vào số dư user và không cộng lần hai.
- User: tìm kiếm, sửa tên, số dư, mật khẩu, khóa/mở tài khoản, cấp/hạ quyền admin.
- Admin đang đăng nhập không thể tự khóa hoặc tự hạ quyền.
- Render-safe: server lắng nghe `0.0.0.0` và dùng `process.env.PORT`.

## Chạy

```powershell
npm install
npm start
```

Mở `http://localhost:3000/admin` sau khi đăng nhập bằng tài khoản admin.

## Render

Environment Variables:

```text
SESSION_SECRET=chuoi_bi_mat_dai
ADMIN_EMAIL=email-admin-cua-ban
ADMIN_PASSWORD=mat-khau-admin-cua-ban
```

Không cần tự đặt `PORT` trên Render.

## Lưu ý

Bản này vẫn dùng `data/database.json` để phù hợp project MVP hiện tại. Không nên dùng JSON làm database lâu dài trên Render. Khi đưa shop vào sử dụng thật, chuyển sang PostgreSQL/MySQL để dữ liệu user, đơn hàng, số dư và nạp tiền không mất khi deploy/restart.
