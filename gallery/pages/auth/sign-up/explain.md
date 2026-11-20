---
title: Đăng ký
route: /sign-in
area: auth
reviewed: 2026-11-20
---

**Concept: Đăng ký.** Mục tiêu: tạo tài khoản bằng email và mật khẩu. Thao tác: `POST /auth/signup` (email, mật khẩu, ngôn ngữ); API gửi email có liên kết xác nhận và luôn trả thành công, kể cả khi email đã có tài khoản. Bố cục: như màn Đăng nhập. Nút chính: "Đăng ký", chỉ bật khi đã tick điều khoản. Lọc: không có. Khác bản hiện tại: không còn ô mã 6 số; sau khi bấm Đăng ký người học thấy màn "Kiểm tra email của bạn". Không còn báo "email này đã có tài khoản" (API không tiết lộ). Không còn nút xã hội trừ Google khi đã cấu hình. Lưu ý xung đột: không có.

## Khung vào app

Vì sao: trang vào app chưa có khung ứng dụng, chỉ logo, tên và đổi ngôn ngữ.

Luật: nền trắng, hairline 1px, không bóng (skills/claude-design/SKILL.md, mục The look; brand.css của app).

Grammar: `EntryFrame`, `Form`

## Học bản chất, để vibe-code mà không mất kiểm soát.

Vì sao: vùng giới thiệu nằm ở 1440 để người học biết mình đang vào đâu; 390 bỏ vùng này.

Luật: danh sách nằm phẳng trên nền với hàng hairline, không viền ngoài (brand.css của app).

Grammar: `Stack`, `Heading`, `Text`

## Thẻ biểu mẫu

Vì sao: cùng thẻ với đăng nhập; thêm ô nhập lại mật khẩu và điều khoản.

Luật: nhãn ô 16/400, ô nhập và nút cùng cao 40px, lỗi là một dòng dưới ô hoặc một Alert (brand.css của app).

Grammar: `Form`, `Input` kind `newPassword`, `Checkbox`, `Button`

## Thay đổi so với bản đã duyệt:

Vì sao: luồng đăng nhập chuyển sang tài khoản do chính ứng dụng quản lý, xác nhận và đặt lại mật khẩu bằng liên kết trong email.

Luật: chủ sản phẩm duyệt lại mọi thay đổi so với bản đã duyệt trước khi code (PROJECT-GALLERY-7).

Grammar: không thêm phần tử mới; dùng lại các phần tử đã nêu ở trên.

– Mật khẩu từ 8 đến 72 ký tự (giới hạn của API), không còn 6 đến 256.

– Không còn mã 6 số; xác nhận bằng liên kết trong email.

– Bỏ báo email đã đăng ký.
