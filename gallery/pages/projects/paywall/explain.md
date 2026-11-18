---
title: Dự án (giới thiệu, chưa đăng ký Premium)
route: /projects
area: projects
reviewed: 2026-11-17
---

Route: `/projects` và mọi màn hình con của nó. Dự án chỉ dành cho người đăng ký Premium (owner 2026-11-17): người chưa đăng ký (thanh trên cùng ghi "Học viên · Chưa có Premium") không thấy một công cụ bị cắt bớt, không có bộ đếm miễn phí, chỉ thấy trang giới thiệu và một nút đăng ký. Cổng nằm ở một chỗ, `features/layouts/ProjectsLayout`; back end vẫn từ chối cùng các cửa. Ảnh chụp cần một tài khoản đã đăng nhập nhưng chưa có Premium (`CAPTURE_FREE_STATE`). Mã: `fe/apps/app/src/components/blocks/ProjectsPitch/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (tiêu đề, một câu mô tả, nút Đăng ký Premium)

Vì sao: nói ngay Dự án chứng minh điều gì (repo thật của bạn, concept đã chứng minh, một dòng CV đã xác minh, nằm trong gói Premium) và nút chính duy nhất là "Đăng ký Premium", dẫn tới trang gói. Không có nút "Tạo dự án" vì không có công cụ nào để dùng thử.
Luật: `premium.md` (Premium là cửa duy nhất), `projects.md`, `theme-and-type.md` (một nút chính mỗi màn hình).
Grammar: `Page header={{ breadcrumbs: "root", title, description, actions }}` (`frame/Page/index.d.ts`), `Button intent="commit" href` (`leaf/Button/index.d.ts`).

## Từ repo của bạn đến dòng CV (ba bước)

Vì sao: ba hàng đánh số trong một danh sách phẳng, không thẻ: mang repo vào (không có dự án mẫu), chứng minh từng concept (Đang luyện trên máy, Đã chứng minh khi CI GitHub ký OIDC hoặc server chạy lại), nhận dòng CV xác minh. Mỗi hàng là một tiêu đề và một dòng mô tả.
Luật: `surface-layering.md` (danh sách đứng thẳng trên nền trang, ngăn bằng đường kẻ), `learner-cli-relay.md`, `projects.md`.
Grammar: `Section kind="list" items[{ title, description, leading: { position } }]` (`frame/Section/index.d.ts`).

## Ví dụ: concept của một milestone

Vì sao: cho người xem thấy trước màn hình họ sẽ có: concept, bằng chứng cần (test ✓ · probe ✓...) và trạng thái (Đã chứng minh, Đang luyện, Chưa bắt đầu). Dữ liệu minh hoạ, ghi rõ ở dòng chú thích dưới bảng; không phải dự án của ai.
Luật: `surface-layering.md` (bảng là tập hợp, không bao bằng thẻ), `verified-experience.md` (hai mức Đang luyện và Đã chứng minh).
Grammar: `Section title caption` bọc `DataTable surface="none"` (`branch/DataTable/index.d.ts`), `Badge tone` (`leaf/Badge/index.d.ts`).

## Ví dụ: dòng CV khi đủ bằng chứng

Vì sao: dòng CV là kết quả cuối của quy trình: vai trò "Backend developer", nhãn "Đã xác minh", một câu mô tả, và dòng muted nói bằng chứng đứng sau (CI run #41 GitHub ký, probe 17/11, 3 concept). Không có số tự khai.
Luật: `verified-experience.md`, `theme-and-type.md` (dòng phụ 12 muted).
Grammar: `Stack gap="identity"`, `Text isStrong`, `Badge tone="success"`, `Text size="sm" tone="muted"`.

## Premium mở những gì ở Dự án

Vì sao: bốn hàng ngắn trả lời "đăng ký thì được gì": nhiều dự án mọi milestone, probe trên địa chỉ deploy, AI đọc code, CI có chữ ký. Hàng cuối trang, không thêm nút chính thứ hai.
Luật: `premium.md`, `theme-and-type.md`.
Grammar: `Section kind="list" items[{ title, description }]`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, "Từ repo của bạn đến dòng CV", bước 2: mô tả bị cắt bằng dấu ba chấm giữa câu ("CI GitHub ký OIDC hoặc s..." ở 1440): mất nội dung.
- 390, cả ba bước và cả bốn hàng "Premium mở những gì" bị cắt bằng dấu ba chấm ở dòng mô tả (một dòng duy nhất), nên không đọc được ý hoàn chỉnh của hàng nào.
- 1440, hai danh sách (ba bước, bốn hàng Premium) có phần thụt khác nhau: số thứ tự và nội dung thụt 44px so với đầu mục, các hàng Premium thụt 12px, còn bảng và CV mẫu không thụt; mép trái của các khối không thẳng.
- 1440, "Ví dụ: dòng CV": chip "Đã xác minh" nền xanh nhạt tô màu đứng ngay dưới tiêu đề rồi sát dòng mô tả, khoảng cách rất chặt; ba cấp (vai trò, chip, câu CV) xếp dọc không có phân nhóm.
- 1440, bảng ví dụ: chip "Đã chứng minh" (xanh) và "Đang luyện" (vàng) tô nền màu; "Chưa bắt đầu" là chữ xám không chip nên ba trạng thái không cùng dạng.
- 1440, dòng chú thích 12 dưới bảng mang sắc nâu, tương phản thấp.
- 1440, dải đầu trang: mô tả 14 muted dài xuống hai dòng và nút "Đăng ký Premium" đứng lệch ở giữa hai dòng, không thẳng với tiêu đề.
- 390, nút "Đăng ký Premium" đứng bên phải mô tả bốn dòng và căn giữa theo chiều dọc, tách khỏi tiêu đề "Dự án"; mô tả bị ép vào cột hẹp.
- 390, bảng ví dụ ẩn cột "Bằng chứng cần" nên người xem không thấy ô bằng chứng mà phần giới thiệu nói tới.
