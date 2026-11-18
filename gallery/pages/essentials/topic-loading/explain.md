---
title: Essentials (chủ đề), đang tải
route: /essentials/[topic]
area: essentials
reviewed: 2026-11-18
---

Trang chủ đề khi lần đọc đầu chưa trả lời. Ảnh ở 1440, 1920 và 390.

## Khung xám cùng hình dữ liệu

Vì sao: đầu trang, thanh tiến độ và các hàng thành khung xám; cột phải ở 1440 là một vùng rỗng đang tải.
Luật: ui/loading (STATE-8).
Grammar: `SlotView placeholder`, `Page isLoading`, `PaneSection isLoading`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc ba khổ với dữ liệu mẫu qua core giả; các lệch của trang chính (Meter nấc đang làm, thanh nhóm, hàng tô xám) vẫn áp dụng ở đây.
