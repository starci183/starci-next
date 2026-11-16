---
title: Tiến độ (chưa đăng ký)
route: /progress
area: progress
---

Route: `/progress` (ảnh chụp: học viên chưa có Premium, đã học một bài). Khung chung và các vùng giống nhau giải thích ở `progress/overview`; ở đây chỉ nêu chỗ khác.

## Bản chất khoá theo gói

Vì sao: phần 1 hiện "Đã mở", phần 2 đến 4 hiện "Cần Premium" và mỗi hàng khoá có liên kết "Xem Premium". Số câu mở bài vẫn hiện đầy đủ vì phần 1 miễn phí.
Luật: `premium.md`, COOK 2026-11-17 access.
Grammar: `ListRowData { badges, action { href, endArrow } }`.

## Dự án là lời mời, không phải công cụ bị cắt

Vì sao: không có số liệu Dự án cho người chưa đăng ký. Vùng Dự án là một hàng duy nhất: "Dự án dành cho gói Premium", một đoạn nói Dự án chấm bài làm thật bằng CI có chữ ký (khái niệm qua CI mới là đã chứng minh, thầy ký mới thành dòng CV) và lệnh "Xem Premium". Máy chủ cũng không đọc Dự án cho truy vấn này khi chưa đăng ký, nên màn hình không phải là cách duy nhất chặn.
Luật: COOK 2026-11-17 access (Dự án chỉ cho người đăng ký, chưa đăng ký thấy lời mời chứ không phải công cụ bị cắt), `premium.md` điều 1.
Grammar: `Section kind="list"` một hàng với `ItemAction { href, endArrow }`.

## Harness và Ôn tập vẫn đầy đủ

Vì sao: Harness miễn phí cho mọi người và Ôn tập có phần miễn phí, nên hai vùng này hiện số liệu như người đăng ký.
Luật: COOK 2026-11-17 access.
Grammar: như `progress/overview`.
