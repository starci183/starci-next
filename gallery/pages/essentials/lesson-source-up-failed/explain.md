---
title: Bài Essentials · Source, lệnh up báo lỗi
route: /essentials/[topic]/[lesson]?part=source
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=source`. Trạng thái: CLI relay một lần chạy `up` thất bại (check id `up`). Khung (thanh trên, thanh bên, đầu bài và tab bốn phần) thuộc lane build-01 và lane bài học; ảnh chụp ở 1440, 1920 và 390, trang cuộn trong từng pane.

## Terminal lỗi `up`

Vì sao: dưới hai lệnh là một Terminal thứ hai ghi dòng lỗi và cách sửa (ví dụ cổng 5440 đang dùng, chạy lại với --port-offset). Dữ liệu là lần chạy `up` failed trong lessonScenarioRuns; khoảng trống API: CLI cần báo kết quả `up` (xem báo cáo).
Luật: `ui/components/data-views.md`.
Grammar: `Terminal title`. Code: `EssentialSource/index.tsx`.

## Phản biện

Vì sao: tự phản biện của lần chụp này trên stand-in core (dữ liệu mẫu của bản vẽ); liệt kê điều còn lệch với khung đã duyệt.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Chưa có API chính thức cho kết quả `up`; trang đọc check id `up` nếu CLI gửi.
