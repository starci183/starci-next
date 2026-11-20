---
title: Đặt mật khẩu mới
route: /sign-in/reset
area: auth
reviewed: 2026-11-20
---

**Concept: Đặt mật khẩu mới.** Mục tiêu: đặt mật khẩu mới từ liên kết trong email. Thao tác: `POST /auth/reset` (token trong địa chỉ, mật khẩu mới); API đặt mật khẩu, xác nhận email và kết thúc mọi phiên đang mở; liên kết trong email là `/auth/reset?token=…` và được chuyển tới trang này. Bố cục: logo, nút đổi ngôn ngữ và một thẻ ở giữa. Nút chính: "Đặt mật khẩu"; xong thì về màn Đăng nhập kèm thông báo xanh. Lọc: không có. Khác bản hiện tại: trang mới. Lưu ý xung đột: không có.

## Khung vào app

Vì sao: trang vào app chưa có khung ứng dụng, chỉ logo, tên và đổi ngôn ngữ.

Luật: nền trắng, hairline 1px, không bóng (skills/claude-design/SKILL.md, mục The look; brand.css của app).

Grammar: `EntryFrame`, `Form`

## Học bản chất, để vibe-code mà không mất kiểm soát.

Vì sao: vùng giới thiệu nằm ở 1440 để người học biết mình đang vào đâu; 390 bỏ vùng này.

Luật: danh sách nằm phẳng trên nền với hàng hairline, không viền ngoài (brand.css của app).

Grammar: `Stack`, `Heading`, `Text`

## Thẻ mật khẩu mới

Vì sao: hai ô và một nút; không cần email vì token đã nói tài khoản nào.

Luật: nhãn ô 16/400, ô nhập và nút cùng cao 40px, lỗi là một dòng dưới ô hoặc một Alert (brand.css của app).

Grammar: `Form`, `Input` kind `newPassword`, `Button`

## Thay đổi so với bản đã duyệt:

Vì sao: luồng đăng nhập chuyển sang tài khoản do chính ứng dụng quản lý, xác nhận và đặt lại mật khẩu bằng liên kết trong email.

Luật: chủ sản phẩm duyệt lại mọi thay đổi so với bản đã duyệt trước khi code (PROJECT-GALLERY-7).

Grammar: không thêm phần tử mới; dùng lại các phần tử đã nêu ở trên.

– Trang mới, thay cho bước mật khẩu mới trong màn nhập mã.
