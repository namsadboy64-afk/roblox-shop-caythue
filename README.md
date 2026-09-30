# Roblox Cày Thuê Shop — Node 24

Bản này đã bỏ `better-sqlite3`, nên npm install không cần Visual Studio/C++ Build Tools.

## Chạy
```powershell
npm.cmd install
npm.cmd start
```
Mở http://localhost:3000

## Admin
Copy `.env.example` thành `.env` và đặt ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET. Admin được tạo khi server khởi động.

## Database
MVP lưu tại `data/database.json`. Phù hợp test/traffic nhỏ. Production nên chuyển PostgreSQL/MySQL hoặc persistent volume.

## Nạp thẻ
Có Viettel, MobiFone, VinaPhone, Vietnamobile. Hiện chỉ ghi nhận yêu cầu; chưa tự động xác thực thẻ thật.
