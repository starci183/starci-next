---
title: Essentials (danh mục), không khớp bộ lọc
route: /essentials
area: essentials
reviewed: 2026-11-18
---

Trạng thái không khớp: ô tìm có chữ không bài nào chứa. Ảnh ở 1440, 1920 và 390.

## Thanh công cụ giữ nguyên

Vì sao: tab, ô tìm (còn chữ vừa gõ) và hai ô chọn đứng yên để học viên sửa bộ lọc ngay.
Luật: ui/composition-sections (toolbar không đổi theo kết quả).
Grammar: `Section kind="region" filter`.

## Thông báo không khớp

Vì sao: một thông báo giữa trang nêu đúng chữ đã tìm, gợi ý cách tìm theo bài toán và nút "Xóa bộ lọc" trả về trạng thái ban đầu.
Luật: ui/components/empty-state (nói điều gì thiếu và cách thoát).
Grammar: `EmptyNotice message description actionLabel onAction frame="frameless"`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc ba khổ với dữ liệu mẫu qua core giả; các lệch của trang chính (Meter nấc đang làm, thanh nhóm, hàng tô xám) vẫn áp dụng ở đây.
