---
title: Luyện code, lần đầu
route: /practice
area: practice
reviewed: 2026-11-18
---

Route: `/practice`. Danh sách pattern: nút chính là bài kế tiếp, lọc ở trình duyệt, cột phải nói mức sẵn sàng, bài đang làm dở và cách chấm. Luyện code miễn phí nên không còn chip Premium.

## Băng đầu trang

Vì sao: Lần đầu: dòng sự kiện nói chưa làm bài nào, nút chính là "Bắt đầu với" pattern đầu.
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Lời mời

Vì sao: Một đoạn ngắn nói bài đầu chỉ mất vài phút trước danh sách.
Luật: `surface-layering`
Grammar: `Section` với `Text`.

## Danh sách phẳng

Vì sao: Danh sách đầy đủ, mọi hàng 0 bài Accepted.
Luật: `surface-layering` (danh sách là Section, không thẻ)
Grammar: `Section kind="list"` với `ListRow` (`composite/ListRow`).

## Phản biện

Vì sao: Chưa thấy chỗ lệch so với bản vẽ ở lần chụp này; chủ dự án duyệt rồi mới sửa tiếp.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
