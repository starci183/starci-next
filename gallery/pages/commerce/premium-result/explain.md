---
title: Kết quả thanh toán Premium
route: /premium/result
area: commerce
reviewed: 2026-11-17
---

Route: `/premium/result` (ảnh chụp: đơn đã trả, Premium được kích hoạt; cổng thanh toán đưa học viên về đây kèm mã đơn). Mã: `fe/apps/app/src/components/blocks/CheckoutResult/component.tsx`. Trang trắng, không đầu trang; kết quả là một bảng điều khiển hẹp (panel kết quả) giữa vùng nội dung, một trong ít chỗ còn dùng thẻ.

## Panel kết quả, đặt giữa trang

Vì sao: một thẻ hairline hẹp (khoảng 450px, bo lớn, không bóng) đặt giữa phần trên của trang: trang chỉ nói một việc, kết quả của một đơn. Tiêu đề thẻ là "Premium đã được kích hoạt" (18/600). Các trạng thái khác dùng cùng khuôn: đang chờ cổng xác nhận, thất bại hoặc quá hạn, không tìm thấy đơn. Ở 390 thẻ rộng gần hết màn hình.
Luật: `surface-layering` (thẻ cho sign-in/result panel), `type-scale-14-12.md`.
Grammar: `SurfaceCard measure="formCompact"` với `Heading` (`frame/SurfaceCard`, `leaf/Heading`); khung xương qua `SlotView`.

## Thông báo "Đã thanh toán"

Vì sao: một `Alert` tông thành công (nền xanh lá nhạt, icon dấu tích tròn): "Đã thanh toán", "Bạn là Premium đến 17 thg 11, 2028. Cảm ơn bạn đã ủng hộ StarCi Next." Tông trạng thái là soft pair của màu, nên đây là chỗ hợp lệ duy nhất dùng nền tô màu. Đơn thất bại hoặc không có đơn đổi tông và lời.
Luật: `theme-and-type` (trạng thái là cặp soft background và soft foreground), `verify-against-visualize.md`.
Grammar: `Alert` có tông theo câu trả lời của máy chủ (`toneOf`) (`composite/Alert`).

## Nút "Tiếp tục học" và "Về trang gói"

Vì sao: hai nút rộng hết thẻ, xếp dọc: "Tiếp tục học" là nút chính duy nhất (accent), "Về trang gói" là nút pill trung tính trắng viền 1px. Đích do máy chủ trả lời, không suy từ địa chỉ trả về. Với đơn khác, thẻ thêm các dòng thông tin đơn và đổi nút chính cho hợp trạng thái (ví dụ "Về trang gói" khi không có đơn).
Luật: `surface-layering` (một nút chính mỗi màn hình).
Grammar: `Button intent="commit" width="fill" href` và `Button intent="neutral" width="fill" href` (`leaf/Button`).
