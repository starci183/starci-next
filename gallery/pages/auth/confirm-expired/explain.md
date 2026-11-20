---
title: Xác nhận email, liên kết hết hạn
route: /sign-in/confirm
area: auth
reviewed: 2026-11-20
---

**Concept: Xác nhận email, liên kết hết hạn.** Trạng thái của màn này: liên kết đã dùng, hết hạn hoặc thiếu token (`IDENTITY_RESET_TOKEN_INVALID`). Mục tiêu: chỉ đường để lấy liên kết mới. Thao tác: `POST /auth/confirm`; lấy liên kết mới bằng `POST /auth/resend` sau khi đăng nhập. Bố cục: như màn Xác nhận email. Nút chính: "Đăng nhập". Lọc: không có. Khác bản hiện tại: trang mới. Lưu ý xung đột: không có.

## Khung vào app

Vì sao: trang vào app chưa có khung ứng dụng, chỉ logo, tên và đổi ngôn ngữ.

Luật: nền trắng, hairline 1px, không bóng (skills/claude-design/SKILL.md, mục The look; brand.css của app).

Grammar: `EntryFrame`, `Form`

## Học bản chất, để vibe-code mà không mất kiểm soát.

Vì sao: vùng giới thiệu nằm ở 1440 để người học biết mình đang vào đâu; 390 bỏ vùng này.

Luật: danh sách nằm phẳng trên nền với hàng hairline, không viền ngoài (brand.css của app).

Grammar: `Stack`, `Heading`, `Text`

## Kết quả xác nhận

Vì sao: người học cần biết liên kết hỏng và bước kế tiếp.

Luật: nhãn ô 16/400, ô nhập và nút cùng cao 40px, lỗi là một dòng dưới ô hoặc một Alert (brand.css của app).

Grammar: `SurfaceCard`, `Heading`, `Button`

## Thay đổi so với bản đã duyệt:

Vì sao: luồng đăng nhập chuyển sang tài khoản do chính ứng dụng quản lý, xác nhận và đặt lại mật khẩu bằng liên kết trong email.

Luật: chủ sản phẩm duyệt lại mọi thay đổi so với bản đã duyệt trước khi code (PROJECT-GALLERY-7).

Grammar: không thêm phần tử mới; dùng lại các phần tử đã nêu ở trên.

– Trang mới.
