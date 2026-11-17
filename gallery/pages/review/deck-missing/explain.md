---
title: Một bộ thẻ, không tìm thấy
route: /review/decks/{id}
area: review
reviewed: 2026-11-18
---

Route: `/review/decks/{id}`. Một bộ thẻ (trang mới): xem bộ có gì trước khi thêm và quản lý sau khi thêm.

## Trạng thái

Vì sao: Không tìm thấy bộ thẻ: thông báo có nút Thử lại.
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
