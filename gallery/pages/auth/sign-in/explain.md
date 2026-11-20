---
title: Đăng nhập
route: /sign-in
area: auth
reviewed: 2026-11-20
---

**Concept: Đăng nhập.** Mục tiêu: vào lại để học tiếp bằng email và mật khẩu. Thao tác: cổng đăng nhập của API (`POST /auth/login` email + mật khẩu, kết quả là phiên trong bộ nhớ và cookie làm mới httpOnly của API; `POST /auth/logout` ở menu avatar); GraphQL `viewerRoles` sau khi có phiên. Bố cục: không có khung ứng dụng, chỉ logo, tên và nút đổi ngôn ngữ. 1440 chia đôi: trái giới thiệu ba khu vực, phải là thẻ biểu mẫu; 390 chỉ còn biểu mẫu. Cùng thẻ này nằm trong modal khi người học bấm Đăng nhập ở đầu trang. Hai ô, "Quên mật khẩu?" cùng hàng nhãn mật khẩu, dòng chuyển sang Đăng ký. Nút chính: "Đăng nhập". Lọc: không có. Khác bản hiện tại: Đăng nhập chỉ còn email và mật khẩu; không còn mã 6 số sau khi nhập mật khẩu: phiên mở ngay tại chỗ, thẻ đóng lại (modal giữ nguyên chỗ người học đang đứng). Bỏ nút Facebook và GitHub. Nút Google chỉ hiện khi hệ thống đã cấu hình Google; chưa cấu hình thì không có nút nào, không có nút chết. Tài khoản cũ từ hệ thống trước không có mật khẩu: dùng Quên mật khẩu một lần, nhận email có liên kết và đặt mật khẩu. Lưu ý xung đột: không có.

## Khung vào app

Vì sao: trang vào app chưa có khung ứng dụng, chỉ logo, tên và đổi ngôn ngữ.

Luật: nền trắng, hairline 1px, không bóng (skills/claude-design/SKILL.md, mục The look; brand.css của app).

Grammar: `EntryFrame`, `Form`

## Học bản chất, để vibe-code mà không mất kiểm soát.

Vì sao: vùng giới thiệu nằm ở 1440 để người học biết mình đang vào đâu; 390 bỏ vùng này.

Luật: danh sách nằm phẳng trên nền với hàng hairline, không viền ngoài (brand.css của app).

Grammar: `Stack`, `Heading`, `Text`

## Thẻ biểu mẫu

Vì sao: một thẻ cho đăng nhập, đăng ký và quên mật khẩu; chỉ đổi ruột thẻ.

Luật: nhãn ô 16/400, ô nhập và nút cùng cao 40px, lỗi là một dòng dưới ô hoặc một Alert (brand.css của app).

Grammar: `Form`, `Field`, `Input`, `Button`, `Link`

## Thay đổi so với bản đã duyệt:

Vì sao: luồng đăng nhập chuyển sang tài khoản do chính ứng dụng quản lý, xác nhận và đặt lại mật khẩu bằng liên kết trong email.

Luật: chủ sản phẩm duyệt lại mọi thay đổi so với bản đã duyệt trước khi code (PROJECT-GALLERY-7).

Grammar: không thêm phần tử mới; dùng lại các phần tử đã nêu ở trên.

– Đăng nhập chỉ còn email và mật khẩu; không còn mã 6 số sau khi nhập mật khẩu: phiên mở ngay tại chỗ, thẻ đóng lại (modal giữ nguyên chỗ người học đang đứng).

– Bỏ nút Facebook và GitHub. Nút Google chỉ hiện khi hệ thống đã cấu hình Google; chưa cấu hình thì không có nút nào, không có nút chết.

– Tài khoản cũ từ hệ thống trước không có mật khẩu: dùng Quên mật khẩu một lần, nhận email có liên kết và đặt mật khẩu.
