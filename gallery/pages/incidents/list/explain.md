---
title: Sự cố, danh sách các sự cố đã viết
route: /incidents
area: incidents
reviewed: 2026-11-20
---

Route: `/incidents`. Mã: `fe/apps/app/src/components/blocks/IncidentsList/component.tsx`. Danh sách chỉ liệt kê các sự cố đã viết, gom theo chủ đề. Dev chưa có sự cố nào được viết nên màn này chưa chụp được: hôm nay trang hiện trạng thái "chưa có sự cố nào", xem `incidents/list-none`.

## Dải đầu trang

Vì sao: tên trang, mô tả và dòng số liệu (số bài, số sự cố đã mở, điều kiện cần thiết bị đã kết nối) nằm trong dải đầu, không còn một dòng chữ nhạt ghép bằng dấu chấm giữa.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title, description, meta, breadcrumbs }}`.

## Các nhóm theo chủ đề

Vì sao: mỗi chủ đề là một `Section` danh sách phẳng; mỗi hàng là một bài có sự cố đã mở, huy hiệu "Đã mở" và một lệnh "Mở sự cố" cao 40px; cả hàng là liên kết. Bài chưa có sự cố không hiện.
Luật: `rows-in-card.md`, một kiểu cho một hàng.
Grammar: `Section kind="list"` với `ListRow badges action`.
