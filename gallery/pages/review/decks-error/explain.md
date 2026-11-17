---
title: Bộ thẻ, lỗi tải
route: /review/decks
area: review
reviewed: 2026-11-18
---

Route: `/review/decks`. Bộ thẻ: chọn bộ muốn ôn. Không có nút chính vì mỗi hàng có lệnh "Thêm bộ thẻ" ngang hàng.

## Trạng thái

Vì sao: Lỗi tải danh sách bộ thẻ có nút Thử lại.
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
