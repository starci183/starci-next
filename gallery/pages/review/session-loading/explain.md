---
title: Phiên ôn, đang tải
route: /review/session
area: review
reviewed: 2026-11-18
---

Route: `/review/session`. Phiên ôn: nhớ lại trước, xem đáp án sau, tự chấm. Bước 1 chỉ có "Hiện đáp án" (phím Space); bước 2 có bốn nút Lại, Khó, Tốt, Dễ với khoảng hẹn ngay dưới.

## Trạng thái

Vì sao: Đang tải bằng khung xám cùng hình dạng.
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
