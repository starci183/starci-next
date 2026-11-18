---
title: Pattern, các bài
route: /practice/patterns/{id}
area: practice
reviewed: 2026-11-18
---

Route: `/practice/patterns/{id}`. Một pattern: đoạn "Khi nào dùng", các bài với độ khó, nhãn và trạng thái, tiến độ pattern và pattern kế tiếp.

## Băng đầu trang

Vì sao: Đường dẫn Luyện code / pattern, dòng "2/5 bài Accepted" và nút chính "Làm bài tiếp theo".
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Danh sách phẳng

Vì sao: Cả hàng là liên kết: số thứ tự, tên, chấm độ khó bằng `Badge isDot`, nhãn kỹ thuật giữ nguyên chữ, badge trạng thái.
Luật: `surface-layering` (danh sách là Section, không thẻ)
Grammar: `Section kind="list"` với `ListRow` (`composite/ListRow`).

## Cột phải

Vì sao: Tiến độ pattern bằng `Progress` và hàng pattern kế tiếp.
Luật: `surface-layering`
Grammar: `Grid kind="main-rail"` với `Section` (`frame/Grid`).

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
