---
title: Bộ thẻ, danh sách
route: /review/decks
area: review
reviewed: 2026-11-18
---

Route: `/review/decks`. Bộ thẻ: chọn bộ muốn ôn. Không có nút chính vì mỗi hàng có lệnh "Thêm bộ thẻ" ngang hàng. Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Băng đầu trang

Vì sao: Đường dẫn Ôn tập / Bộ thẻ, tên trang và luật mỗi ngày tối đa theo mục tiêu.
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Danh sách phẳng

Vì sao: Hai hàng chip (đã thêm hay chưa, lộ trình) đứng trên danh sách; mỗi hàng nói tên, số thẻ, độ khó, nhãn; bên phải "Thêm bộ thẻ" hoặc badge Đã thêm và "Bỏ khỏi hàng đợi"; cả hàng mở trang bộ thẻ.
Luật: `surface-layering` (danh sách là Section, không thẻ)
Grammar: `Section kind="list"` với `ListRow` (`composite/ListRow`).

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
