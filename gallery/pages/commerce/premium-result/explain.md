---
title: Kết quả thanh toán Premium
route: /premium/result
area: commerce
---

Route: `/premium/result` (ảnh chụp: mở trang không kèm mã đơn hợp lệ nên thấy trạng thái "không tìm thấy đơn"; cổng thanh toán đưa học viên về đây kèm mã đơn). Mã: `fe/apps/app/src/components/blocks/CheckoutResult/component.tsx`. Khung chung giải thích ở `learn/home`.

## Thẻ kết quả, đặt giữa trang

Vì sao: một thẻ trắng nổi hẹp (khoảng 450px) đặt giữa vùng nội dung, không có dải tiêu đề: trang chỉ nói một việc, kết quả của một đơn. Tiêu đề thẻ ở đây là "Không tìm thấy đơn thanh toán". Các trạng thái khác dùng cùng khuôn với tiêu đề và thông báo khác: đang chờ cổng xác nhận, đã trả và Premium đã bật, thất bại hoặc quá hạn.
Luật: `pink-page-surface-rule.md` (một thẻ một việc), `type-scale-14-12.md`.
Grammar: `SurfaceCard` với `Heading` (`frame/SurfaceCard`, `leaf/Heading`); trạng thái theo `PresentationState` của Grammar; khung xương qua `SlotView`.

## Thông báo "Không có đơn"

Vì sao: một `Alert` tông cảnh báo (vàng nhạt, icon tam giác) nói bằng lời: không tìm thấy đơn này trong tài khoản của bạn và hãy quay lại trang gói tạo đơn mới. Thông báo ở trong thẻ chứ không nổi ngoài, để học viên đọc cùng nút bên dưới.
Luật: `verify-against-visualize.md`, `grammar-slot-interface`.
Grammar: `Alert` có tông theo câu trả lời của máy chủ (`toneOf`), ở đây là tông cảnh báo (`composite/Alert`).

## Nút "Về trang gói"

Vì sao: một nút chính toàn chiều rộng của thẻ, là việc duy nhất học viên làm tiếp được. Với đơn khác (đã trả, đang chờ, thất bại) thẻ thêm các dòng thông tin đơn (`DescriptionList`) và nút phụ trung tính; đích của nút do máy chủ trả lời, không suy từ địa chỉ trả về.
Luật: `verify-against-visualize.md` (một nút chính mỗi vùng).
Grammar: `Button intent="commit" href` (`leaf/Button`).
