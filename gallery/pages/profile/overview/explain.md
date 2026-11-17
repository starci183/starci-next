---
title: Hồ sơ của bạn
route: /profile
area: profile
---

Route: `/profile` (ảnh chụp: học viên đã có ảnh, hai dòng CV Đã xác minh, một máy nối, một token MCP, đang dùng Premium). Mã: `fe/apps/app/src/components/blocks/ProfileHub/` (`component.tsx` vẽ, `index.tsx` nối dữ liệu và lời). Theme trắng của Grammar 0.40: mọi vùng là một `Section` phẳng, không thẻ nổi.

## Đầu trang (Hồ sơ của bạn, dòng phụ)

Vì sao: tiêu đề 18/600 sát trái và một dòng muted nói mọi mục dưới đây do StarCi chấm, không tự khai. Trang chỉ đọc và sửa thông tin, nên đầu trang không có lệnh chính.
Luật: `COOK.md` theme trắng (đầu trang là `Page header`, không thẻ), `theme-and-type.md` điều 3 (không cỡ chữ lớn để tạo thứ bậc).
Grammar: `Page header={{ title, titleScale: "standard", description }}` (`frame/Page/index.d.ts`).

## Danh tính (ảnh, tên, lộ trình mục tiêu)

Vì sao: ba việc của một người nằm trong một vùng. Ảnh đại diện `Avatar` cỡ lg, bên cạnh là nút chữ "Tải ảnh lên" và "Xoá ảnh" (chỉ khi đã có ảnh); dòng gợi ý "PNG, JPEG hoặc WebP, tối đa 2 MB" lấy giới hạn từ máy chủ (`limits` của `myProfile`), không viết cứng. Ảnh được kiểm loại và dung lượng ở trình duyệt trước, rồi máy chủ ký một địa chỉ tải lên cố định loại và dung lượng, trình duyệt gửi thẳng tới kho (MinIO ở dev), máy chủ xác nhận lại những gì kho đang giữ. Tên hiển thị là ô nhập có nút "Lưu tên" (tắt khi chưa đổi); để trống thì hiện tên tài khoản. Lộ trình mục tiêu đọc từ capability path, kèm liên kết "Đổi lộ trình".
Luật: `conventions.md` điều 3 (mọi chữ có vi và en), `conventions.md` điều 4 (không lộ dữ liệu chấm).
Grammar: `Section`, `Avatar size="lg"`, `FileButton text` (`composite/FileButton/index.d.ts`, cho `description` và `errorMessage`), `Input`, `Button size="sm" intent="neutral"`, `Link variant="plain"`.

## Dòng CV đã xác minh

Vì sao: danh sách phẳng chỉ gồm mục Đã xác minh của Bản chất, Dự án và Harness. Mỗi hàng là dòng CV đã ký, dòng phụ "Ký bởi Thầy ngày ..., loại bằng chứng", chip phần (Bản chất, Dự án, Harness) và liên kết "Bằng chứng" tới `/verify/{mã}`. Dưới danh sách có dòng "0/3 mục Đã xác minh để được giới thiệu việc làm" và số mục đang chờ duyệt, rồi chú thích mục chưa ký vẫn nằm ở Kinh nghiệm. Mục đang luyện hay chờ duyệt không bao giờ vào đây.
Luật: `verified-experience.md` điều 4 (chỉ mục Đã xác minh được tính vào hồ sơ và CV), điều 10 (chuỗi ngày và điểm không thành dòng CV).
Grammar: `Section kind="list" count description caption action` với `Link variant="head"`; hàng `ListRowData { badges, action { href, endArrow } }`.

## Liên kết xác minh công khai

Vì sao: mỗi mục Đã xác minh có một liên kết `/verify/{mã}` để nhà tuyển dụng mở; hàng ghi dòng CV, địa chỉ đầy đủ ở dòng phụ, chip Công khai hoặc Riêng tư theo việc học viên có hiện mục lên hồ sơ công khai hay không, và một lệnh chữ "Sao chép liên kết" (đổi thành "Đã sao chép"). Chú thích nói người xem chỉ thấy dòng đã ký, không thấy điểm số hay tên người duyệt.
Luật: `verified-experience.md` điều 7 (trang xác minh không lộ tên người duyệt).
Grammar: `Section kind="list"` với `ItemAction { press }`.

## Máy đã nối, MCP token, Gói của bạn

Vì sao: ba bảng điều khiển tài khoản, mỗi bảng đọc từ capability của nó và có đúng một liên kết quản lý ở cuối hàng đầu: "Quản lý" tới `/devices`, "Mở Kết nối" tới `/connect`, "Quản lý gói" tới `/premium`. Máy hiện tên, hệ điều hành, lần thấy cuối và chip Đang kết nối hoặc Ngoại tuyến; token hiện tên và hậu tố bí mật (không bao giờ hiện token), lần dùng cuối; gói hiện "Premium đến ngày ..." hoặc Miễn phí kèm câu nói rõ phần miễn phí (phần 1 của Bản chất và Harness). Một bảng lỗi đọc thì tự ẩn, các bảng khác vẫn hiện.
Luật: `premium.md` (một câu hỏi entitlement duy nhất, gói đọc từ đó), `learner-cli-relay.md` (máy nối qua relay), `mcp.md` (token không bao giờ hiện lại).
Grammar: `Section kind="list" count action`, `Badge isDot`, `SlotView forbidden="hide"` (`@starci-next/ui`).

## Trạng thái đang tải / lỗi

Vì sao: mỗi vùng tự đọc và tự vẽ skeleton cùng hình khi đang tải; vùng lỗi nói "không tải được" kèm nút Thử lại, các vùng khác không bị kéo theo.
Luật: `conventions.md` điều 5, `grammar-slot-interface.md` (chỉ SlotView rẽ nhánh theo trạng thái).
Grammar: `SlotView slot placeholder labels onRetry`, cờ `isLoading` của `Section`.
