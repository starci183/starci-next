---
title: Essentials (danh mục), lỗi tải
route: /essentials
area: essentials
reviewed: 2026-11-18
---

Trạng thái lỗi: danh mục không đọc được. Ảnh ở 1440, 1920 và 390.

## Tên trang và thông báo lỗi

Vì sao: tên trang còn nguyên; phần thân thành một thông báo nói không tải được và có nút "Thử lại" chạy lại đúng lần đọc hỏng. Tiến độ của học viên không bị mất.
Luật: ui/components/toast-alert, ui/loading (lỗi giữ đầu trang).
Grammar: `SlotView onRetry`, `Alert tone="negative" action`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc ba khổ với dữ liệu mẫu qua core giả; các lệch của trang chính (Meter nấc đang làm, thanh nhóm, hàng tô xám) vẫn áp dụng ở đây.
