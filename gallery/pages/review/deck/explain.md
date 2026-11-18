---
title: Một bộ thẻ, chưa thêm
route: /review/decks/{id}
area: review
reviewed: 2026-11-18
---

Route: `/review/decks/{id}`. Một bộ thẻ (trang mới): xem bộ có gì trước khi thêm và quản lý sau khi thêm.

## Băng đầu trang

Vì sao: Đường dẫn ba mục, tên bộ, dòng sự kiện và một nút chính: Thêm bộ thẻ này, Đang thêm… hoặc Ôn bộ này.
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Số liệu và thẻ mẫu

Vì sao: Mô tả, một hàng số liệu (đã thêm thì có Đang nhớ tốt và Cần ôn lại), ba thẻ mẫu chỉ có câu hỏi; thẻ mẫu là vật thật nên có thẻ viền.
Luật: `surface-layering`
Grammar: `Section kind="figures"`, `SurfaceCard` (body).

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
