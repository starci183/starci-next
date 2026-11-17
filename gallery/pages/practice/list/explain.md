---
title: Luyện code (các pattern)
route: /practice
area: practice
reviewed: 2026-11-17
---

Route: `/practice` (ảnh chụp: học viên Premium, chưa Accepted bài nào). Mã: `fe/apps/app/src/components/blocks/PracticeCatalog/component.tsx` (vẽ), `index.tsx` (đọc các pattern và tiến độ). Khung chung giải thích ở `learn/home`.

## Dải đầu trang "Luyện code"

Vì sao: dải trắng phẳng, viền dưới, sát trái, chỉ có tiêu đề 18/600: trang là gốc của mục nên không có đường dẫn và không có lệnh ở dải.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ title, titleScale: "standard", breadcrumbs: "root" }}` (`frame/Page/index.d.ts`).

## Phần giới thiệu "Luyện code"

Vì sao: một `Section` phẳng trên nền trắng, không còn thẻ nền nhạt: đoạn mở đầu nói chấm thật trên máy chấm với test ẩn và AI chỉ gợi ý, một dòng muted thống kê ("20 pattern · 96 bài · 0 bài Accepted") và dòng muted nói số bài Accepted tính vào mức sẵn sàng đi làm. Học viên Premium nên không có hàng nâng cấp và cả trang không có nút chính; học viên miễn phí sẽ thấy thêm hàng nâng cấp với một nút chính "Mở toàn bộ bài" (không có trong ảnh).
Luật: `surface-layering` (Section thay thẻ, một nút chính mỗi màn), `theme-and-type`.
Grammar: `PracticeBrowse` (`fe/packages/starci-next-ui/src/composites/PracticeBrowse`) gồm `Section`, `Text` và `UpsellRow` (chỉ khi chưa Premium).

## Danh sách "Các pattern"

Vì sao: một `Section` danh sách phẳng, các hàng ngăn nhau bằng đường kẻ 1px: số thứ tự đơn sắc, tên 500 (Mảng, Chuỗi, Băm...), dòng 12 muted "0/5 bài Accepted" và bên phải nút pill trung tính "Mở pattern". Hàng là điều hướng tới `practice/pattern`. Học viên Premium nên không hàng nào có chip "Premium" (chip chỉ hiện ở pattern khoá với học viên miễn phí). Số thứ tự 10 trở đi rộng hơn nên tên lệch ba điểm ảnh so với hàng 1 đến 9. CHƯA RÕ: hai mươi nút "Mở pattern" giống nhau trong khi hàng vốn đã là liên kết, nên nút chỉ lặp lại chức năng.
Luật: `surface-layering` (danh sách là Section, không thẻ; lệnh lặp theo hàng là nút trung tính nhỏ), `theme-and-type`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trong `Section`, `Button` neutral cỡ sm.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: đoạn mở đầu là chữ foreground 14 như thân, còn hai dòng thống kê bên dưới muted ngả nâu đỏ; ba dòng nối tiếp không có nhịp rõ, dòng "20 pattern · 96 bài · 0 bài Accepted" khó phân biệt với mô tả.
- 1440: danh sách pattern căng hết bề rộng (x=288 đến 1408) với một nút "Mở pattern" ở mép phải; mắt phải quét hơn 1000px từ tên đến nút.
- 1440: hai mươi nút "Mở pattern" giống nhau trong khi cả hàng đã là liên kết; nút viền mảnh gần như vô hình.
- 1440: số thứ tự đơn cách từ "10." trở đi rộng hơn nên tên lệch ba điểm ảnh so với hàng 1 đến 9.
- 1440: hai mươi hàng đều "0/..." nên chỉ báo tiến độ không giúp chọn.
- 1920: nội dung co vào giữa (x=480 đến 1696) trong khi tiêu đề trang sát trái x=288; lệch trục. Các lỗi lặp tiêu đề, nút lặp và lệch số thứ tự giữ nguyên.
- 390: số thứ tự 10 trở đi vẫn đẩy tên lệch so với hàng 1 đến 9; nút "Mở pattern" chiếm khoảng 90px bên phải làm tên có ít chỗ.
