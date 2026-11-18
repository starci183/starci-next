---
title: Giải bài, đang tải
route: /practice/{slug}
area: practice
reviewed: 2026-11-18
---

Route: `/practice/{slug}`. Giải bài: đề, mã, kết quả, gợi ý. Nút chính theo trạng thái: Nộp bài, Đang chấm, hoặc Bài tiếp theo khi Accepted. Xem lời giải trước khi Accepted phải xác nhận vì bài không vào kinh nghiệm Luyện code.

## Trạng thái

Vì sao: Đang tải bằng khung xám cùng hình dạng.
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
