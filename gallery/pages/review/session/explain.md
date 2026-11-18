---
title: Phiên ôn, câu hỏi
route: /review/session
area: review
reviewed: 2026-11-18
---

Route: `/review/session`. Phiên ôn: nhớ lại trước, xem đáp án sau, tự chấm. Bước 1 chỉ có "Hiện đáp án" (phím Space); bước 2 có bốn nút Lại, Khó, Tốt, Dễ với khoảng hẹn ngay dưới.

## Băng đầu trang

Vì sao: Đường dẫn Ôn tập / Phiên ôn, dải "4/8 thẻ" với thời gian còn lại và thanh tiến độ.
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Thẻ câu hỏi

Vì sao: Thẻ câu hỏi là vật thật nên có viền; có nguồn, loại câu hỏi và lần ôn.
Luật: `surface-layering`
Grammar: `SurfaceCard`, `Textarea`, `Kbd`, `Button`.

## Đáp án và chấm

Vì sao: Điều bạn nhớ cạnh đáp án, bốn nút chấm, mỗi nút một khoảng hẹn dưới nó; Tốt là mặc định.
Luật: `surface-layering`
Grammar: `Button` trong `Stack` (hàng nút có khoảng hẹn là chỗ Grammar còn thiếu, đã ghi lại).

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
