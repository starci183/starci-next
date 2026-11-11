# Thư viện ảnh starci-next

Mỗi màn hình một thư mục: ảnh ở từng độ rộng và lời giải thích của mọi vùng (PROJECT-GALLERY-1, PROJECT-GALLERY-2).

- `pages/<area>/<screen>/` là một màn hình (một agent, một trạng thái). Thư mục chỉ chứa các ảnh `<width>.png` (1440, 1920 và 390), tệp giải thích explain.md và links.json tùy chọn, không gì khác. Bản trạng thái hoặc bản của agent khác là thư mục riêng; so sánh trước/sau nằm trong báo cáo sửa.
- explain.md có front matter (`title`, `route`, `area`) và mỗi vùng một mục `## <tên vùng>` với các dòng `Vì sao:`, `Luật:` (tên tệp memory hoặc anchor contexts) và `Grammar:`. Vùng không giải thích được bằng một luật và một tham chiếu Grammar là lỗi: sửa trước khi báo cáo; CHƯA RÕ hoặc SAI là cảnh báo khi chạy local và là lỗi ở `starci app check --env prod`.
- links.json liệt kê các vùng bấm của màn hình, `{ "to": "<area>/<screen>", "x", "y", "w", "h" }` (tỉ lệ của ảnh); flows.json đặt tên các luồng gồm mã màn hình có thứ tự, `{ "<tên luồng>": ["<area>/<screen>"] }`. Chế độ Bản đồ luồng vẽ chúng.
- `npm install && npm run dev` chạy thư viện tại http://localhost:3050 (cổng gốc của app + 50); `starci app stack up --env dev` khởi động cùng app. Tệp mới hiện sau khi tải lại. Thư viện chỉ hiện màn hình có explain.md; `starci app check` fail ở các màn hình còn lại.
- Các tệp PNG bị git bỏ qua; explain.md, links.json, flows.json và ứng dụng thư viện là mã nguồn, ứng dụng do `starci app sync` quản lý.
