---
title: Dự án (danh sách)
route: /projects
area: projects
---

Route: `/projects`, dành cho người đăng ký Premium (người khác thấy `projects/paywall`). Học viên mang repo của chính mình vào; không có dự án mẫu, nên danh sách trống chỉ có lời mời "Tạo dự án". Mã: `fe/apps/app/src/components/blocks/ProjectsList/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (tiêu đề, mô tả, Tạo dự án)

Vì sao: tiêu đề "Dự án của bạn", một câu nói mỗi dự án là một repo và chứng minh concept để có dòng CV, và nút chính duy nhất "Tạo dự án" (có dấu cộng) ở bên phải. Trang gốc của mục nên không có đường dẫn.
Luật: `theme-and-type.md` (một nút chính mỗi màn hình), `projects.md`.
Grammar: `Page header={{ breadcrumbs: "root", title, description, actions }}`, `Button intent="commit" startGlyph="plus" href`.

## Ribbon bốn số

Vì sao: dải số liệu một hàng giữa hai đường kẻ, không khung, không bo góc: concept đã chứng minh, concept còn lại, milestone xong (n / m), dòng CV xác minh (mỗi milestone xong là một dòng). Tính từ danh sách dự án thật.
Luật: `surface-layering.md` (ribbon thay cho thẻ số), `verified-experience.md` (chỉ concept đã chứng minh mới thành kinh nghiệm).
Grammar: `Section kind="figures" ribbon ariaLabel items[{ term, value, unit }]` (`frame/Section/index.d.ts`, `frame/SurfaceCard/FigureCells.d.ts`).
CHƯA RÕ: `ProjectSummary` của back end chưa có số concept đang luyện và trạng thái CI mới nhất, nên ô "Đang luyện" của bản vẽ là "Concept còn lại" và cột CI là địa chỉ deploy; cần lane projects-10 thêm hai trường.

## Bảng dự án

Vì sao: một bảng phẳng trên nền trang dưới đầu mục "Dự án của bạn" (kèm số lượng): dự án + repo (dòng 12 muted), loại (app trung tính, agent nhấn), milestone hiện tại (lấy tên từ catalog), thanh tiến độ cùng "5/8", địa chỉ deploy. Cả hàng là liên kết tới dự án. Cột phụ ẩn dưới 768 và 1280 để bảng không cuộn ngang. Dòng chú thích dưới bảng nhắc không có dự án mẫu.
Luật: `surface-layering.md` (bảng là tập hợp, không bao bằng thẻ), `projects.md` (không có dự án mẫu).
Grammar: `Section title count caption` bọc `DataTable surface="none" columns[{ width, hideBelow }] rows[{ href }]` (`branch/DataTable/index.d.ts`), `Badge tone`, `Progress` qua `RowProgress` của starci-next-ui.

## Trạng thái rỗng, đang tải, lỗi

Vì sao: chưa có dự án thì chỗ của bảng là lời mời tạo dự án đầu tiên; đang tải thì ribbon và bảng giữ hình khối (skeleton) qua `isLoading`; lỗi đọc nằm trong đầu mục của bảng với nút thử lại.
Luật: `surface-layering.md`.
Grammar: `EmptyNotice frame="frameless"`, `Section isLoading error`, `DataTable isLoading emptyContent`.
