---
title: Hàng chờ duyệt (chỉ thầy và người duyệt)
route: /review-queue
area: career
---

Route: `/review-queue` (ảnh chụp: tài khoản học viên thường, nên thấy trạng thái bị từ chối; thầy và người duyệt thấy danh sách các mục chờ ký). Mã: `fe/apps/app/src/components/blocks/ReviewQueue/component.tsx`. Khung chung giải thích ở `learn/home`.

## Thông báo "Chỉ thầy và người duyệt được mở trang này"

Vì sao: người không có quyền không thấy danh sách mà thấy một trạng thái cấm: ô icon hộp thư và một câu. Đây là cách `SlotView` nói trạng thái `forbidden` của cửa dữ liệu, giữ nguyên khung ứng dụng để học viên đi tiếp được. CHƯA RÕ: trạng thái này không có đường quay lại và không có dải tiêu đề; sidebar cũng vẫn không có mục "Hàng chờ", nên chỉ vào bằng địa chỉ. Ảnh thấy hàng chờ thật cần một tài khoản thầy trong dev, chưa có trong dữ liệu chụp.
Luật: `grammar-slot-interface` (chỉ SlotView rẽ nhánh trạng thái), `type-scale-14-12.md`.
Grammar: `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`) với nhãn `forbidden`, thông báo rỗng `EmptyNotice` của Grammar (`composite/EmptyNotice`).
