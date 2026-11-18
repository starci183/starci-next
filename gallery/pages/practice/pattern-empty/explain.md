---
title: Pattern chưa có bài
route: /practice/patterns/{id}
area: practice
reviewed: 2026-11-18
---

Route: `/practice/patterns/{id}`. Một pattern: đoạn "Khi nào dùng", các bài với độ khó, nhãn và trạng thái, tiến độ pattern và pattern kế tiếp.

## Trạng thái

Vì sao: Pattern chưa có bài: thông báo rỗng với nút về danh sách pattern.
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
