---
title: Luyện code, không khớp bộ lọc
route: /practice
area: practice
reviewed: 2026-11-18
---

Route: `/practice`. Danh sách pattern: nút chính là bài kế tiếp, lọc ở trình duyệt, cột phải nói mức sẵn sàng, bài đang làm dở và cách chấm. Luyện code miễn phí nên không còn chip Premium.

## Trạng thái

Vì sao: Không khớp: thông báo rỗng trong danh sách với nút "Xoá bộ lọc"; ô tìm và chip vẫn ở chỗ cũ.
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
