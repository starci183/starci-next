---
title: Đăng nhập bằng mạng xã hội (trang trả về)
route: /sign-in/callback
area: auth
---

Route: `/sign-in/callback` (ảnh chụp: mở trang không kèm mã và trạng thái hợp lệ từ nhà cung cấp nên thấy thất bại; trong luồng thật Facebook hoặc GitHub chuyển về đây kèm `code` và `state`). Mã: `fe/apps/app/src/components/blocks/SocialCallbackStatus/component.tsx` trên cùng khung với `auth/sign-in`. Nút mạng xã hội của màn đăng nhập thật ra chưa cấu hình nhà cung cấp trong dev, nên chưa chụp được luồng thành công.

## Khung đăng nhập (không có thanh bên, thanh trên)

Vì sao: trang chưa có phiên nên không có điều hướng: chỉ nút tròn đổi ngôn ngữ ở góc phải, thương hiệu giữa trang và thẻ trắng nổi, giống `auth/sign-in`.
Luật: `pink-page-surface-rule.md`, `locale-switch-round-dropdown.md`.
Grammar: `AuthPanel` (`fe/apps/app/src/components/blocks/AuthPanel`), `IdentityLockup` (`composite/IdentityLockup`), `SurfaceCard`.

## Thông báo thất bại trong thẻ

Vì sao: khi hoàn tất đăng nhập mạng xã hội thất bại, thẻ đăng nhập hiện lại với một thông báo đỏ nhạt "Chưa đăng nhập được bằng tài khoản mạng xã hội. Hãy thử lại." ngay dưới tiêu đề, để học viên thử lại bằng chính các nút bên dưới mà không rời trang. Trong lúc đang hoàn tất, thông báo là dòng trạng thái đang xử lý; khi thành công trang chuyển thẳng vào ứng dụng.
Luật: `verify-against-visualize.md`, `grammar-slot-interface`.
Grammar: `Alert tone="negative"` (`composite/Alert`), `SocialCallbackStatus` (`fe/apps/app/src/components/blocks/SocialCallbackStatus`).

## Các nút "Tiếp tục với Facebook" và "GitHub", biểu mẫu email

Vì sao: cùng nội dung như `auth/sign-in`: hai nút mạng xã hội trung tính rộng đầy thẻ, vạch "hoặc", ô email hoặc tên đăng nhập, ô mật khẩu có "Hiện mật khẩu", liên kết "Quên mật khẩu?" và nút chính "Đăng nhập" (một nút chính), cuối thẻ "Chưa có tài khoản? Đăng ký". Chi tiết từng vùng ở `auth/sign-in`.
Luật: `verify-against-visualize.md`, `type-scale-14-12.md`.
Grammar: `Button intent="neutral"` và `Button intent="commit"`, `TextField` (`composite/TextField`), `Link`; xem `auth/sign-in`.
