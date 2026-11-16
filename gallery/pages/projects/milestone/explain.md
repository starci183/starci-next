---
title: Dự án / Milestone
route: /projects/[projectId]/[milestoneId]
area: projects
---

Route: `/projects/<projectId>/<milestoneId>`. Mã: `fe/apps/app/src/components/blocks/ProjectMilestone/`. Ảnh chụp hiện tại là trạng thái "không có milestone này" (không có dự án và milestone trong dữ liệu chụp), nên chỉ giải thích những gì thấy; trang đầy đủ (danh sách concept, bảng lần chạy, aside "Cách chứng minh") chưa có ảnh. CHƯA RÕ: cần chụp lại với một dự án có milestone để gallery phản ánh trang chính.

## Thông báo "Không có milestone này"

Vì sao: milestone không có trong dự án thì thấy trạng thái giữa trang: ô icon hộp thư xám nhạt, tiêu đề đậm "Không có milestone này" và một dòng muted "Dự án này không liệt kê milestone đó." Không dải tiêu đề, không thẻ.
Luật: `grammar-slot-interface`, `surface-layering` (trạng thái nằm trong trang).
Grammar: `SlotView` và `MissingNotice`.

## Liên kết "Về dự án"

Vì sao: lối quay về `projects/detail`, đặt dưới thông báo, chữ foreground. CHƯA RÕ: không có mũi tên và không nằm trong đường dẫn của băng đầu trang; nên là `Page header.breadcrumbs` hoặc kết thúc bằng "→".
Luật: `surface-layering` (liên kết điều hướng có mũi tên), `page-header-left-sublabel-xs.md`.
Grammar: `Link variant="plain" href` trong `MissingNotice`.
