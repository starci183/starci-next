---
title: Essentials (danh mục), đang tải
route: /essentials
area: essentials
reviewed: 2026-11-18
---

Trạng thái đang tải: lần đọc đầu chưa trả lời. Ảnh ở 1440, 1920 và 390.

## Khung xám cùng hình dữ liệu

Vì sao: cùng cây với danh mục nhưng nhận dữ liệu giả cùng hình, nên khi dữ liệu về không có gì nhảy; tiêu đề, dòng sự kiện, nút chính, thanh, hàng đều thành khung.
Luật: ui/loading (STATE-8: mọi lá và hợp phần nhận `isLoading`, chỉ SlotView rẽ nhánh).
Grammar: `SlotView placeholder`, `Page isLoading`, `Section isLoading`, `Meter isLoading`, `Progress isLoading`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc ba khổ với dữ liệu mẫu qua core giả; các lệch của trang chính (Meter nấc đang làm, thanh nhóm, hàng tô xám) vẫn áp dụng ở đây.
