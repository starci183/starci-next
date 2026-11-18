---
title: Bài Essentials · Tự áp dụng, mức Khó còn khóa
route: /essentials/[topic]/[lesson]?part=apply
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=apply`. Trạng thái: học viên chọn mức Khó khi mức Vừa chưa xong. Khung (thanh trên, thanh bên, đầu bài và tab bốn phần) thuộc lane build-01 và lane bài học; ảnh chụp ở 1440, 1920 và 390, trang cuộn trong từng pane.

## Thông báo mức khóa

Vì sao: thay chi tiết mức bằng một thông báo nói mức nào mở sau mức nào, mức dưới đang bao nhiêu điểm và điều kiện mở theo backend (mọi kịch bản ẩn của mức dưới xanh). Không có nút chính khi mức khóa.
Luật: `learner-cli-relay`.
Grammar: `Alert tone="informative"`. Code: `EssentialApply/index.tsx` `RungBody`.

## Phản biện

Vì sao: tự phản biện của lần chụp này trên stand-in core (dữ liệu mẫu của bản vẽ); liệt kê điều còn lệch với khung đã duyệt.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Bản vẽ có ổ khóa trong thông báo (Alert không có ô biểu tượng khóa); điều kiện 80/100 trong bản vẽ được thay bằng luật của backend.
