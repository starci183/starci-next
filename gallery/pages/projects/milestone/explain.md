---
title: Dự án / Milestone
route: /projects/[projectId]/[milestoneId]
area: projects
reviewed: 2026-11-17
---

Route: `/projects/<projectId>/<milestoneId>`, dành cho người đăng ký Premium. Một milestone là danh sách concept Bản chất; mỗi concept cần đủ ô bằng chứng. Mã: `fe/apps/app/src/components/blocks/ProjectMilestone/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (đường dẫn, tên milestone, "5 / 8 đã chứng minh", chip trạng thái)

Vì sao: đường dẫn Dự án / tên dự án / milestone; dòng phụ nói đã chứng minh bao nhiêu trên tổng số; chip Đã xong hoặc Đang làm.
Luật: `theme-and-type.md`, `verified-experience.md`.
Grammar: `Page header={{ breadcrumbs, title, meta, status }}`, `Badge tone`.

## Bảng concept với ô bằng chứng

Vì sao: bảng phẳng, mỗi hàng một concept: tên và loại (Hành vi hoặc Cấu trúc), các ô bằng chứng nó cần (test, e2e, probe, AI đọc code) mỗi ô là một chip có tông theo trạng thái (đạt kèm "đang luyện" hoặc "đã chứng minh", lỗi, chưa có), trạng thái Đang luyện hay Đã chứng minh, và bài Bản chất để học lại. Cả hàng mở trang bằng chứng của concept. Dòng chú thích dưới bảng giải nghĩa hai mức: Đang luyện = chạy trên máy qua relay; Đã chứng minh = CI GitHub ký OIDC, probe của server hoặc AI đọc code.
Luật: `verified-experience.md` (hai mức), `learner-cli-relay.md`, `surface-layering.md`.
Grammar: `Section title count caption` bọc `DataTable surface="none" rows[{ href }]`, `Badge tone`, `Link variant="plain"`.

## Lần chạy bằng chứng gần đây

Vì sao: một bảng phẳng thứ hai: mỗi ô bằng chứng đã có kết quả là một hàng (concept, loại bằng chứng, đạt hay lỗi, mức, lúc nào); chưa có thì nói chạy test trên máy hoặc đẩy lên GitHub.
Luật: `verified-experience.md`.
Grammar: `Section` + `DataTable surface="none"`.

## Cách chứng minh và CI có chữ ký

Vì sao: hai khối cạnh nhau ở cuối trang: bốn bước đánh số (viết bằng chứng, chạy trên máy là Đang luyện, đẩy lên GitHub, kết quả có chữ ký hoặc server chạy lại thì thành Đã chứng minh) và lời giải thích rằng chỉ kết quả có chữ ký mới tính, kèm liên kết tới bí mật trong trang dự án.
Luật: `learner-cli-relay.md`, `projects.md`.
Grammar: `Grid kind="pair"`, `Section kind="list" items[{ leading: { position } }]`, `Link variant="plain"`.

## Trạng thái không tìm thấy, bị khoá, đang tải

Vì sao: milestone không có thì thông báo kèm đường về dự án; cửa Premium của back end từ chối thì thông báo kèm liên kết Premium; đang tải thì bảng giữ hình khối.
Luật: `premium.md`, `surface-layering.md`.
Grammar: `MissingNotice` (starci-next-ui), `Page isLoading`, `DataTable isLoading`.
