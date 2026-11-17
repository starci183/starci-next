---
title: Bài Essentials · Source, chưa thấy máy nào kết nối
route: /essentials/[topic]/[lesson]?part=source
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=source`. Trạng thái: relayDevices trả danh sách rỗng. Khung (thanh trên, thanh bên, đầu bài và tab bốn phần) thuộc lane build-01 và lane bài học; ảnh chụp ở 1440, 1920 và 390, trang cuộn trong từng pane.

## Dòng máy

Vì sao: một chip chấm xanh ghi tên máy trực tuyến lấy từ relayDevices; khi không có máy nào, một thông báo vàng nói thẳng chưa thấy máy, bảo chạy lệnh đăng nhập một lần và trang tự nhận khi CLI báo về.
Luật: `ui/components/toast-alert.md` (Alert nói trạng thái, không thẻ trong thẻ), `theme-and-type` (tông vàng là cảnh báo).
Grammar: `Badge isDot tone="success"`, `Alert tone="cautionary"` (`composite/Alert`). Code: `EssentialSource/index.tsx` `MachineLine`, `EssentialScenarios/Detail.tsx`.

## Khối lệnh

Vì sao: vẫn hiện hai lệnh để học viên chạy; trang tự nhận máy khi CLI báo về (đọc lại định kỳ).
Luật: `ui/loading.md` (trạng thái không chặn nội dung).
Grammar: `Terminal`. Code: `EssentialSource/index.tsx`.

## Phản biện

Vì sao: tự phản biện của lần chụp này trên stand-in core (dữ liệu mẫu của bản vẽ); liệt kê điều còn lệch với khung đã duyệt.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Thông báo vàng ở trên cùng của khối, đúng khung; chưa thấy lệch.
