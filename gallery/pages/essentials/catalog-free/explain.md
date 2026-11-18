---
title: Essentials (danh mục), tài khoản miễn phí
route: /essentials
area: essentials
reviewed: 2026-11-18
---

Danh mục cho tài khoản chưa có Premium. Ảnh ở 1440, 1920 và 390.

## Nút chính

Vì sao: "Nâng cấp Premium" thay cho "Học tiếp"; đây là nút chính duy nhất của trang.
Luật: ui/components/button, premium (một lối tới gói).
Grammar: `Button intent="commit" href`.

## Nhãn của hàng bài

Vì sao: mọi hàng ghi "Phần 1 miễn phí" thay cho nhãn trạng thái, vì gói miễn phí học trọn phần 1 của mọi bài; bốn vạch vẫn cho thấy tiến độ thật.
Luật: premium (phần 1 miễn phí, phần 2 đến 4 cần Premium).
Grammar: `ListRow badges tone="neutral"`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc ba khổ với dữ liệu mẫu qua core giả; các lệch của trang chính (Meter nấc đang làm, thanh nhóm, hàng tô xám) vẫn áp dụng ở đây.
