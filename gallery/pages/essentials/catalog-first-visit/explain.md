---
title: Essentials (danh mục), lần đầu
route: /essentials
area: essentials
reviewed: 2026-11-18
---

Trạng thái lần đầu của `/essentials`: học viên chưa học bài nào. Cùng cây với danh mục; khác ở dữ liệu. Ảnh ở 1440, 1920 và 390.

## Dải đầu và nút chính

Vì sao: dòng sự kiện ghi "bạn chưa học bài nào" và nút chính là "Bắt đầu: <bài đầu tiên>" vì chưa có bài dở.
Luật: ui/components/page-header, ui/components/button (một nút chính).
Grammar: `Page header { meta, actions: Button intent="commit" }`.

## Tab và đếm

Vì sao: Đang học 0, Đã xong 0, Chưa học bằng tổng; ba trạng thái vẫn cộng lại bằng Tất cả.
Luật: ui/components/tabs (count chip).
Grammar: `Tabs kind="filter"` với `count`.

## Hàng bài và thanh tiến độ

Vì sao: bốn vạch của mọi bài là rãnh trống, nhãn "Chưa học", thanh của nhóm 0/n.
Luật: ui/components/list-table, `theme-and-type` (số đo dùng foreground).
Grammar: `ListRow detail: Meter segments={4}`, `Progress`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc ba khổ với dữ liệu mẫu qua core giả; các lệch của trang chính (Meter nấc đang làm, thanh nhóm, hàng tô xám) vẫn áp dụng ở đây.
