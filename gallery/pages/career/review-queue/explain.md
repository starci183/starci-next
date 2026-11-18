---
title: Hàng chờ duyệt (chỉ thầy và người duyệt)
route: /review-queue
area: career
reviewed: 2026-11-17
---

Route: `/review-queue` (ảnh chụp: tài khoản học viên thường, nên thấy trạng thái bị từ chối; thầy và người duyệt thấy danh sách các mục chờ ký). Mã: `fe/apps/app/src/components/blocks/ReviewQueue/component.tsx`. Trang trắng, không thẻ.

## Thông báo "Chỉ thầy và người duyệt được mở trang này"

Vì sao: người không có quyền không thấy danh sách mà thấy một trạng thái cấm giữa trang: ô icon hộp thư xám nhạt và một câu (không có dòng mô tả). Đây là cách `SlotView` nói trạng thái `forbidden`, giữ nguyên khung ứng dụng để học viên đi tiếp được. CHƯA RÕ: không có đường quay lại và không có đầu trang; sidebar không có mục "Hàng chờ" nên chỉ vào bằng địa chỉ. Chưa chụp được hàng chờ thật vì dữ liệu chụp chưa có tài khoản thầy.
Luật: `grammar-slot-interface` (chỉ SlotView rẽ nhánh trạng thái), `type-scale-14-12.md`.
Grammar: `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`) nhãn `forbidden`, `EmptyNotice` (`composite/EmptyNotice`).

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: trang không có dải tiêu đề, không tiêu đề và không đường quay lại; chỉ một ô icon hộp thư và câu căn giữa nên người dùng không biết đang ở trang nào và không có lối ra ngoài sidebar.
- 1440: trạng thái cấm dùng icon hộp thư (giống trạng thái rỗng) và không có dòng mô tả cách có quyền; câu nằm sát trên (y=182), trang trống bên dưới.
- 390: cùng trạng thái không đầu trang, không lối quay lại; câu "Chỉ thầy và người duyệt được mở trang này" gần khít hai mép khi ngắt dòng.
