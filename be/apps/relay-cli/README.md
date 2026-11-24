# StarCi Relay

Lệnh `starci-relay` chạy lab và kịch bản của StarCi Next ngay trên máy của bạn, rồi gửi kết quả về trang bài học.

```bash
npm i -g @starci/next-relay
starci-relay login
```

Cần Node.js 22 trở lên.

| Lệnh | Việc nó làm |
| --- | --- |
| `starci-relay --version` | In phiên bản đang cài |
| `starci-relay status` | Cho biết máy đã nối tài khoản chưa và Relay có tự chạy khi đăng nhập không |
| `starci-relay login` | In mã 8 ký tự để nhập ở trang Máy của bạn |
| `starci-relay pair <mã>` | Nối máy bằng mã sao chép từ trang Máy của bạn, rồi tạo khoá thiết bị để máy ký kết quả chấm lab |
| `starci-relay listen` | Nhận yêu cầu chạy từ StarCi (kịch bản, lab) và chạy sau khi bạn đồng ý |
| `starci-relay install-service` | Bật Relay tự chạy khi đăng nhập, ở mức người dùng, không cần quyền admin |
| `starci-relay uninstall-service` | Tắt tự chạy |
| `starci-relay run`, `pull`, `up`, `check` | Chạy bài như trang bài học hướng dẫn |

Cập nhật: `npm i -g @starci/next-relay@latest`. Gỡ: `starci-relay uninstall-service`, rồi `npm rm -g @starci/next-relay`.

Hướng dẫn đầy đủ nằm ở mục Trợ giúp, bài "Cài StarCi Relay", trong StarCi Next.
