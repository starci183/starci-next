---
title: Dự án (danh sách)
route: /projects
area: projects
reviewed: 2026-11-17
---

Route: `/projects`, dành cho người đăng ký Premium (người khác thấy `projects/paywall`). Học viên mang repo của chính mình vào; không có dự án mẫu. Mã: `fe/apps/app/src/components/blocks/ProjectsList/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (tiêu đề, mô tả, Tạo dự án)

Vì sao: tiêu đề "Dự án của bạn", một câu nói mỗi dự án là một repo và chứng minh concept để có dòng CV, và nút chính duy nhất "Tạo dự án" (có dấu cộng) ở bên phải. Trang gốc của mục nên không có đường dẫn. Ở 390 mô tả xuống nhiều dòng và nút nằm cạnh.
Luật: `theme-and-type.md` (một nút chính mỗi màn hình), `projects.md`.
Grammar: `Page header={{ breadcrumbs: "root", title, description, actions }}`, `Button intent="commit" startGlyph="plus" href`.

## Ribbon bốn số

Vì sao: dải số liệu một hàng giữa hai đường kẻ, không khung, không bo góc: concept đã chứng minh, concept đang luyện, milestone xong (n / 11) và dòng CV xác minh. Ở 390 thành lưới 2 x 2. Tính từ danh sách dự án thật.
Luật: `surface-layering.md` (ribbon thay cho thẻ số), `verified-experience.md`.
Grammar: `Section kind="figures" ribbon ariaLabel items[{ term, value, unit }]` (`frame/Section/index.d.ts`, `frame/SurfaceCard/FigureCells.d.ts`).

## Bảng dự án

Vì sao: một bảng phẳng trên nền trang dưới đầu mục "Dự án của bạn" (kèm chip đếm): dự án + repo (dòng 12 muted), loại (chip "Ứng dụng"), milestone hiện tại, thanh tiến độ cùng "0/9" và trạng thái CI ("Chưa nối CI"). Cả hàng là liên kết tới dự án. Dưới 768 chỉ còn cột Dự án và Tiến độ để bảng không cuộn ngang. Dòng chú thích 12 dưới bảng nhắc không có dự án mẫu. Chưa có dự án thì chỗ của bảng là lời mời tạo dự án; đang tải thì ribbon và bảng giữ hình khối.
Luật: `surface-layering.md` (bảng là tập hợp, không bao bằng thẻ), `projects.md` (không có dự án mẫu).
Grammar: `Section title count caption` bọc `DataTable surface="none" columns[{ width, hideBelow }] rows[{ href }]` (`branch/DataTable/index.d.ts`), `Badge tone`, `RowProgress` của starci-next-ui, `EmptyNotice frame="frameless"`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, bảng dự án, cột Milestone hiện tại: hiện tên "Nền tảng HTTP", còn ở 1920 cùng dữ liệu hiện mã thô "bf-http-foundation": hai độ rộng cho hai nội dung khác nhau, mã thô lộ ra người dùng.
- 1440 và 1920, cột Tiến độ: thanh tiến độ 0/9 chỉ là một vạch xám rất nhạt, gần như vô hình trên nền trắng; số "0/9" nằm lệch xuống dưới thanh và không cùng dòng với các cột khác.
- 1440 và 1920, bảng: các ô Loại, Milestone, Tiến độ, CI căn dọc không đồng đều (chip "Ứng dụng" và "Chưa nối CI" thấp hơn tên dự án), hàng trông lệch.
- 1440 và 1920, chip "Ứng dụng" có nền xám đặc (tô nền) thay vì nền trắng với đường kẻ; "Chưa nối CI" là chữ xám nhạt 12 độ tương phản thấp.
- 1440 và 1920, dòng chú thích dưới bảng: chữ 12 màu muted có sắc nâu, tương phản thấp, khó đọc.
- 1920, ribbon, tiêu đề bảng và bảng bị giới hạn bề rộng và canh giữa (bắt đầu ở x=480), còn dải đầu trang canh trái ở x=288: hai mép trái lệch nhau 192px.
- 1920, nút "Tạo dự án" dính sát mép phải màn hình trong khi nội dung bên dưới bị thu hẹp ở giữa.
- 390, bảng dự án: ẩn mất cột Loại, Milestone hiện tại và CI nên người dùng không thấy trạng thái CI hay milestone ở điện thoại; chỉ còn tiến độ.
- 390, dải đầu trang: mô tả bị ép vào cột hẹp 4 dòng vì nút chiếm bên phải; nút "Tạo dự án" đứng lệch so với tiêu đề.
- 390, chú thích "Không có dự án mẫu..." 12 muted xuống dòng sát mép dưới bảng, không có khoảng đệm với bảng.
