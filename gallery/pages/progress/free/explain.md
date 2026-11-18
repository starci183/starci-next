---
title: Tiến độ (chưa đăng ký)
route: /progress
area: progress
---

Route: `/progress` (ảnh chụp: học viên chưa có Premium). Khung chung và các vùng giống `progress/overview`; ở đây chỉ nêu chỗ khác. Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Essentials: phần bị khóa

Vì sao: phần 2 đến 4 ghi "Cần Premium" kèm liên kết "Xem Premium"; phần 1 vẫn "Đã mở". Học viên thấy ngay mình mở được gì và thiếu gì, không bị giấu.
Luật: `premium.md` (phần 1 của mỗi bài Essentials miễn phí, phần 2 đến 4 cần Premium).
Grammar: `Section kind="list"` + `ListRow` với `badges` và `action`.

## Dự án: hàng lời mời

Vì sao: Dự án là một hàng lời mời ("Dự án dành cho gói Premium"), không có số liệu giả. Luyện code và Ôn tập đầy đủ vì cả hai miễn phí, dòng mô tả dưới tiêu đề là "Gói miễn phí".
Luật: `premium.md` (Dự án chỉ có ở Premium).
Grammar: `Section kind="list"` + `ListRow` với `action`.
