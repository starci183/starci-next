---
title: Ôn tập, có thẻ đến hạn
route: /review
area: review
reviewed: 2026-11-18
---

Route: `/review`. Ôn tập hôm nay: biết hôm nay phải ôn gì và bắt đầu ngay. Miễn phí nên không có thẻ khoá. Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Băng đầu trang

Vì sao: Dải đầu với dòng sự kiện (thẻ đến hạn, quá hạn, mục tiêu, chuỗi) và một nút chính "Bắt đầu ôn N thẻ".
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Ba con số

Vì sao: Một hàng số kẻ mảnh: đến hạn, thẻ mới có thể thêm, đã ôn hôm nay.
Luật: `surface-layering`
Grammar: `Section kind="figures"` (không ribbon).

## Danh sách phẳng

Vì sao: Các thẻ sắp ôn theo thứ tự đến hạn, tiêu đề là câu hỏi, nguồn là bộ thẻ hoặc bài Essentials, badge vàng khi quá hạn.
Luật: `surface-layering` (danh sách là Section, không thẻ)
Grammar: `Section kind="list"` với `ListRow` (`composite/ListRow`).

## Biểu đồ nhớ

Vì sao: Tỷ lệ nhớ theo lần ôn và một câu nói lần sau nhớ tốt hơn là bình thường.
Luật: `surface-layering`
Grammar: `BarChart`.

## Cột phải

Vì sao: Mục tiêu mỗi ngày với lệnh chữ "Đổi" nằm trong thân mục (mở hộp thoại; ở 390 không còn đè lên dòng số thẻ), và bộ thẻ của bạn với liên kết đầu mục "Quản lý".
Luật: `surface-layering`
Grammar: `Grid kind="main-rail"` với `Section` (`frame/Grid`), `TextAction`, `Link variant="head"`.

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
