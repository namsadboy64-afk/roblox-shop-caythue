# RobloxShop - PostgreSQL migration

1. Create a PostgreSQL database on Render in the same region as the Web Service.
2. Add `DATABASE_URL` = the Internal Database URL.
3. Keep `SESSION_SECRET`.
4. Set `ADMIN_EMAIL=nguyentatkiennam@gmail.com`.
5. Set `ADMIN_PASSWORD` to the admin password you want. An existing admin password is not overwritten on restart.
6. Push `server.js` and `package.json`.
7. On first boot, if PostgreSQL is empty and `data/database.json` exists in the deployed repo, the server imports users/services/orders/topups and hashes legacy plaintext passwords.
8. Sessions are stored in PostgreSQL via `connect-pg-simple`, so Render restarts do not wipe the session store.
9. The temporary `/api/setup-admin` and `/api/reset-admin-password` endpoints are removed.

Important: do not publish `data/database.json` because the supplied file contains a plaintext password. Remove it from Git after migration if it is currently tracked.
