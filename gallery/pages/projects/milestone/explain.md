---
title: Dự án / Milestone
route: /projects/[projectId]/[milestoneId]
area: projects
reviewed: 2026-11-17
---

Route: `/projects/<projectId>/<milestoneId>`, dành cho người đăng ký Premium. Một milestone là danh sách concept Bản chất; mỗi concept cần đủ ô bằng chứng. Mã: `fe/apps/app/src/components/blocks/ProjectMilestone/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (đường dẫn, tên milestone, chip trạng thái, "0/3 concept đã chứng minh")

Vì sao: đường dẫn Dự án / tên dự án / milestone; chip "Đang làm" (hoặc Đã xong) cạnh tên; dòng 12 muted nói đã chứng minh bao nhiêu trên tổng số.
Luật: `theme-and-type.md`, `verified-experience.md`.
Grammar: `Page header={{ breadcrumbs, title, meta, status }}`, `Badge tone`.

## Concept của milestone

Vì sao: bảng phẳng dưới đầu mục có chip đếm, mỗi hàng một concept: tên và loại (Hành vi hoặc Cấu trúc), các ô bằng chứng nó cần (test, e2e, probe, AI đọc code) xếp thành cột chữ, trạng thái ("Chưa bắt đầu") và bài Bản chất để học lại ("Học ở"). Cả hàng mở trang bằng chứng của concept. Dòng chú thích dưới bảng giải nghĩa hai mức: Đang luyện = chạy trên máy qua relay; Đã chứng minh = CI GitHub ký OIDC, probe của server hoặc AI đọc code. Ở 390 chỉ còn cột Concept và Trạng thái.
Luật: `verified-experience.md` (hai mức), `learner-cli-relay.md`, `surface-layering.md`.
Grammar: `Section title count caption` bọc `DataTable surface="none" rows[{ href }]`, `Badge tone`, `Link variant="plain"`.

## Lần chạy bằng chứng

Vì sao: bảng phẳng thứ hai (cột Concept, Bằng chứng, Kết quả, Mức, Lúc) có chip đếm 0; chưa có lần chạy nào thì thân bảng nói "Chưa có lần chạy nào" và một dòng bảo chạy test trên máy hoặc đẩy lên GitHub.
Luật: `verified-experience.md`.
Grammar: `Section` + `DataTable surface="none"` có nội dung rỗng.

## Cách chứng minh

Vì sao: bốn bước đánh số trong danh sách phẳng: viết bằng chứng, chạy trên máy (Đang luyện), đẩy lên GitHub (CI ký gửi kết quả), kết quả có chữ ký hoặc server chạy lại thì thành Đã chứng minh.
Luật: `learner-cli-relay.md`, `projects.md`.
Grammar: `Section kind="list" items[{ leading: { position } }]`.

## CI có chữ ký

Vì sao: đoạn giải thích chỉ kết quả có chữ ký mới tính là Đã chứng minh, kèm liên kết "Xem bí mật trong dự án →". Đứng cạnh "Cách chứng minh" ở 1440 và 1920, đứng dưới ở 390.
Luật: `learner-cli-relay.md`, `projects.md`.
Grammar: `Grid kind="pair"`, `Section`, `Link variant="plain"`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440 và 1920, bảng concept, cột Bằng chứng: các ô test, e2e, probe, AI đọc code hiện là chữ xám rời xếp dọc, không có chip tông theo trạng thái (đạt, lỗi, chưa có); không đọc được ô nào đã đạt.
- 1440 và 1920, bảng concept: mỗi hàng cao khoảng 100px vì ba dòng bằng chứng xếp dọc; tên concept, trạng thái và "Học ở" căn giữa còn cột bằng chứng căn đầu nên các cột trong một hàng không thẳng hàng.
- 1440 và 1920, cột Trạng thái: "Chưa bắt đầu" là chữ xám nhạt, không phải chip; khác với chip "Đang làm" ở đầu trang.
- 1440, 1920, 390, chip "Đang làm" ở đầu trang có nền vàng nhạt tô màu, lệch tông so với các chip xám khác trên trang (luật: không tô nền).
- 1440 và 1920, cột "Học ở": liên kết chữ đen đậm như văn bản thường, không có dấu hiệu là liên kết, kéo dài sát mép phải bảng.
- 1440 và 1920, dòng chú thích dưới bảng: chữ 12 có sắc nâu, tương phản thấp.
- 1440 và 1920, "Lần chạy bằng chứng": tiêu đề cột vẫn hiện trên bảng rỗng, rồi một vùng trống cao khoảng 140px với chữ canh giữa, trong khi các bảng khác canh trái.
- 1920, dải đầu trang canh trái ở x=288, còn bảng và các Section thu hẹp ở giữa từ x=480: mép trái lệch 192px.
- 1440 và 1920, "CI có chữ ký": cột phải ngắn hơn nhiều cột "Cách chứng minh" nên một nửa vùng trống; mô tả muted sắc nâu.
- 390, bảng concept ẩn cột Bằng chứng và Học ở, người dùng không thấy ô bằng chứng nào cần và không có đường dẫn học lại.
- 390, số thứ tự "1." đến "4." của "Cách chứng minh" là chữ mono nâu nhạt, tương phản thấp.
- Lần chụp lại 2026-11-17 trên dev: bảng đủ 4 concept của Nền tảng HTTP (request-response-lifecycle, health-probe-semantics, error-contract, unit-testing-behavior) với ô test, e2e, probe, AI đọc code; các điều trên vẫn đúng ở 1440 và 390.
- 1440 và 390, mọi concept ghi 'Thầy đang soạn bài Bản chất này, concept này chưa tính vào milestone' và 'Chưa có bài' vì `learn` của catalog trỏ tới bài chưa sống; đúng theo luật nhưng cả 4 hàng lặp cùng một câu và học viên không biết khi nào concept sẽ tính được.
