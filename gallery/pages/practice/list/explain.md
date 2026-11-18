---
title: Luyện code, danh sách
route: /practice
area: practice
reviewed: 2026-11-18
---

Route: `/practice`. Danh sách pattern: nút chính là bài kế tiếp, lọc ở trình duyệt, cột phải nói mức sẵn sàng, bài đang làm dở và cách chấm. Luyện code miễn phí nên không còn chip Premium.

## Băng đầu trang

Vì sao: Dải đầu một dòng sự kiện (số pattern, số bài, số bài Accepted, Miễn phí) và một nút chính "Làm bài tiếp theo" (lần đầu "Bắt đầu với Mảng").
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Danh sách phẳng

Vì sao: Ô tìm và bốn chip có đếm đứng trên danh sách; mỗi hàng có số thứ tự, tên, tiến độ bằng chữ và một thanh `Meter` mảnh, cả hàng là liên kết (bỏ nút "Mở pattern" lặp).
Luật: `surface-layering` (danh sách là Section, không thẻ)
Grammar: `Section kind="list"` với `ListRow` (`composite/ListRow`).

## Cột phải

Vì sao: Mức sẵn sàng đi làm (số bài Accepted), bài đang làm dở với nút "Làm tiếp" và ba dòng nói cách chấm; ở 390 xuống dưới danh sách.
Luật: `surface-layering`
Grammar: `Grid kind="main-rail"` với `Section` (`frame/Grid`).

## Phản biện

Vì sao: Ô tìm và chip chưa nằm trên một hàng ở 1440; số đếm "Đang làm" lấy từ dữ liệu nên có thể khác số mẫu của bản vẽ.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
