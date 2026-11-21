---
title: Phiên ôn, xung đột chấm
route: /review/session
area: review
reviewed: 2026-11-20
---

Route: `/review/session`. Phiên ôn: nhớ lại trước, xem đáp án sau, tự chấm. Bước 1 chỉ có "Hiện đáp án" (phím Space); bước 2 có bốn nút Lại, Khó, Tốt, Dễ với khoảng hẹn ngay dưới.

## Trạng thái

Vì sao: Chấm ở máy khác làm lệch revision: báo xung đột và nút "Tải lại thẻ".
Luật: `FE-ERROR-1` (chỉ `SlotView` rẽ nhánh), `grammar-slot-interface`
Grammar: `SlotView` với `Alert`, `EmptyNotice` và `isLoading` của Section, ListRow.

## Đầu trang

Vì sao: Đầu trang (tên, dòng số liệu, một nút chính) đi qua `SlotView` cùng nội dung: tiêu đề giữ nguyên khi đọc lỗi hay rỗng. Đường dẫn Ôn tập / Phiên ôn nằm trong `Page header`; khi chưa có thẻ nào, nút chính "Chọn bộ thẻ" đứng ở đầu trang.
Luật: `grammar-slot-interface`.
Grammar: `SlotView` với `header`, `headerFallback` và `frame`.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
