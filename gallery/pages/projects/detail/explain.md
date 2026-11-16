---
title: Dự án / Chi tiết
route: /projects/[projectId]
area: projects
---

Route: `/projects/<projectId>`. Mã: `fe/apps/app/src/components/blocks/ProjectDetail/`. Ảnh chụp hiện tại là trạng thái "không tìm thấy dự án" (mã dự án không có trong dữ liệu chụp, danh sách dự án đang rỗng), nên chỉ giải thích những gì thấy; trang đầy đủ (milestone, lần chạy, aside kho mã) chưa có ảnh. CHƯA RÕ: cần chụp lại với một dự án thật để gallery phản ánh trang chính.

## Thông báo "Không tìm thấy dự án"

Vì sao: mở dự án không thuộc mình hoặc không tồn tại thì thấy một trạng thái giữa trang: ô icon hộp thư xám nhạt, tiêu đề đậm "Không tìm thấy dự án" và một dòng muted "Dự án này không có trong danh sách của bạn." Không dải tiêu đề, không thẻ; khung ứng dụng giữ nguyên để đi tiếp.
Luật: `grammar-slot-interface` (chỉ SlotView rẽ nhánh trạng thái), `surface-layering` (trạng thái nằm trong trang, không thẻ).
Grammar: `SlotView` và `MissingNotice` (`fe/packages/starci-next-ui/src/composites/MissingNotice`).

## Liên kết "Tất cả dự án"

Vì sao: lối quay về danh sách `projects/list`, đặt dưới thông báo, chữ foreground. CHƯA RÕ: liên kết đứng riêng, không có mũi tên và không nằm trong đường dẫn của băng đầu trang; nên là `Page header.breadcrumbs` hoặc kết thúc bằng "→".
Luật: `surface-layering` (liên kết điều hướng có mũi tên), `page-header-left-sublabel-xs.md`.
Grammar: `Link variant="plain" href` trong `MissingNotice`.
