---
title: Đăng nhập bằng mạng xã hội (trang trả về)
route: /sign-in/callback
area: auth
reviewed: 2026-11-17
---

Route: `/sign-in/callback` (ảnh chụp: mở trang không kèm mã và trạng thái hợp lệ từ nhà cung cấp nên thấy thất bại; trong luồng thật Facebook hoặc GitHub chuyển về đây kèm `code` và `state`). Mã: `fe/apps/app/src/components/blocks/SocialCallbackStatus/component.tsx` trên cùng khung với `auth/sign-in`. Nút mạng xã hội trong dev chưa cấu hình nhà cung cấp, nên chưa chụp được luồng thành công.

## Khung đăng nhập (không có thanh bên, thanh trên)

Vì sao: trang chưa có phiên nên không có điều hướng: chỉ nút tròn đổi ngôn ngữ ở góc phải, thương hiệu giữa trang và thẻ đăng nhập viền 1px, trắng, không bóng, giống `auth/sign-in`.
Luật: `theme-and-type`, `locale-switch-round-dropdown.md`.
Grammar: `AuthPanel` (`fe/apps/app/src/components/blocks/AuthPanel`), `IdentityLockup` (`composite/IdentityLockup`), `SurfaceCard`.

## Thông báo thất bại trong thẻ

Vì sao: khi hoàn tất đăng nhập mạng xã hội thất bại, thẻ đăng nhập hiện lại với thông báo lỗi "Chưa đăng nhập được bằng tài khoản mạng xã hội. Hãy thử lại." ngay dưới tiêu đề, để học viên thử lại bằng các nút bên dưới mà không rời trang. Thông báo là cặp màu mềm của `--danger` (nền hồng nhạt, chữ đỏ đậm, icon tròn): đây là trạng thái lỗi chứ không phải giếng tô màu. Đang hoàn tất thì là dòng trạng thái đang xử lý; thành công thì chuyển thẳng vào ứng dụng.
Luật: `theme-and-type` (trạng thái dùng cặp màu mềm), `grammar-slot-interface`.
Grammar: `Alert tone="negative"` (`composite/Alert`), `SocialCallbackStatus` (`fe/apps/app/src/components/blocks/SocialCallbackStatus`).

## Các nút "Tiếp tục với Facebook" và "GitHub", biểu mẫu email

Vì sao: cùng nội dung như `auth/sign-in`: hai nút mạng xã hội viền, vạch "hoặc", ô email hoặc tên đăng nhập, ô mật khẩu có "Hiện mật khẩu", "Quên mật khẩu?" và MỘT nút chính "Đăng nhập", cuối thẻ "Chưa có tài khoản? Đăng ký". Chi tiết từng vùng ở `auth/sign-in`.
Luật: `surface-layering` (một nút chính), `theme-and-type`, `type-scale-14-12.md`.
Grammar: `Button intent="neutral"` và `Button intent="commit"`, `TextField` (`composite/TextField`), `TextAction`; xem `auth/sign-in`.
