---
title: Hồ sơ của học viên mới
route: /profile
area: profile
---

Route: `/profile` (ảnh chụp: học viên mới, chưa có ảnh, chưa có mục Đã xác minh, chưa nối máy, chưa có token, gói Miễn phí). Mã và khung chung giải thích ở `profile/overview`.

## Danh tính khi chưa có ảnh

Vì sao: `Avatar` vẽ hình mầm sinh từ tên (chưa có ảnh nên không có nút "Xoá ảnh"); nút duy nhất là "Tải ảnh lên". Chưa chọn lộ trình thì dòng mục tiêu ghi "Chưa chọn lộ trình" và liên kết đổi thành "Chọn lộ trình".
Luật: `learning-program.md` (lộ trình là tùy chọn, không phần nào bị chặn vì chưa chọn).
Grammar: `Avatar` (mặc định `fallbackMark="sprout"`), `FileButton text`.

## Dòng CV và liên kết xác minh khi rỗng

Vì sao: vùng CV nói thẳng điều cần làm ("Hoàn thành một bản dựng Harness, một dự án hoặc một bài Bản chất để có dòng đầu tiên") thay vì một danh sách trống; vùng liên kết nói liên kết xuất hiện khi một mục được xác minh. Đếm "0/3 mục Đã xác minh" vẫn hiện để học viên biết ngưỡng.
Luật: `verified-experience.md` điều 4, `unhandled-case-tells-customer.md` (không để trống im lặng).
Grammar: `Section kind="list" empty`.

## Tài khoản khi chưa có gì

Vì sao: máy và token rỗng mỗi bảng một câu ngắn ("Chưa nối máy nào.", "Chưa có token nào.") và vẫn giữ liên kết quản lý để học viên đi nối; gói ghi "Miễn phí" và "Phần 1 của mỗi bài Bản chất và toàn bộ Harness là miễn phí", liên kết "Quản lý gói" dẫn tới trang Premium.
Luật: `premium.md` (bậc miễn phí), COOK 2026-11-17 mục access (Harness miễn phí cho mọi người).
Grammar: `Section kind="list" empty`, `Badge isDot tone="muted"`.
