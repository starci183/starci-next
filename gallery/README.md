# Thư viện ảnh starci-next

Mỗi màn hình một thư mục: ảnh ở từng độ rộng và lời giải thích của mọi vùng (PROJECT-GALLERY-1, PROJECT-GALLERY-2). Ứng dụng thư viện là một cấu hình mỏng trên @starci/gallery: vite.config.js là toàn bộ.

- `pages/<area>/<screen>/` là một màn hình (một agent, một trạng thái). Thư mục chỉ chứa các ảnh `<width>.png` (1440 và 390), tệp giải thích explain.md và links.json tùy chọn, không gì khác. Bản trạng thái hoặc bản của agent khác là thư mục riêng (`<screen>-empty`, `<screen>-loading`, `<screen>-error`); so sánh trước/sau nằm trong báo cáo sửa.
- explain.md có front matter (`title`, `route`, `area`) và mỗi vùng một mục `## <tên vùng>` với các dòng `Vì sao:`, `Luật:` (tên tệp memory hoặc anchor contexts) và `Grammar:`. Vùng không giải thích được bằng một luật và một tham chiếu Grammar là lỗi: sửa trước khi báo cáo; CHƯA RÕ hoặc SAI là cảnh báo khi chạy local và là lỗi ở `starci app check --env prod`.
- links.json liệt kê các vùng bấm của màn hình, `{ "to": "<area>/<screen>", "x", "y", "w", "h" }` (tỉ lệ của ảnh); flows.json đặt tên các luồng gồm mã màn hình có thứ tự, `{ "<tên luồng>": ["<area>/<screen>"] }`. Chế độ Bản đồ luồng vẽ chúng.
- Canvas thiết kế (thư mục canvas của .starcistacks, PROJECT-GALLERY-6) cho mỗi màn khung đã duyệt cạnh ảnh thật và chấm trạng thái (design.json): khớp xanh lá, đã code còn lệch vàng, ảnh cũ đỏ, chưa code xám.
- `npm install && npm run dev` chạy thư viện tại http://localhost:3250 (cổng gốc của app + 50); `starci app stack up --env dev` khởi động cùng app. Tệp mới hiện sau khi tải lại. Thư viện chỉ hiện màn hình có explain.md hoặc có mục trong design; `starci app check` fail ở các màn hình còn lại.
- Các tệp PNG bị git bỏ qua; explain.md, links.json, flows.json và vite.config.js là mã nguồn, cấu hình do `starci app sync` quản lý.
