---
title: Xác minh công khai một kinh nghiệm
route: /verify/[code]
area: auth
reviewed: 2026-11-17
---

Route: `/verify/[code]` (ảnh chụp: một mã đúng định dạng nhưng StarCi chưa từng xác minh, nên thấy trạng thái "không tìm thấy"). Trang công khai, không cần đăng nhập, nên không có thanh bên và thanh trên; nền trắng. Mã: `fe/apps/app/src/components/blocks/VerifyExperience/component.tsx` (vẽ), `index.tsx` (đọc, không có phiên). Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Thông báo "Không tìm thấy mã xác minh"

Vì sao: người nhận CV mở liên kết do học viên gửi; mã không khớp thì trang nói thẳng bằng một ô icon hộp thư (ô xám nhạt bo góc), tiêu đề "Không tìm thấy mã xác minh" và dòng muted "Mã này không khớp với kinh nghiệm nào đã được StarCi xác minh." Trang không bao giờ đoán hay hiện kết quả gần đúng. Mã sai định dạng cũng đọc thành "không tìm thấy" chứ không còn là lỗi chung. Thông báo nằm thẳng trên trang, không thẻ. CHƯA RÕ: thông báo dính sát mép trên (cách đỉnh khoảng 56px), phần còn lại của trang trống, và không có tên thương hiệu StarCi để người lạ biết trang của ai; nên có một dòng thương hiệu ở đầu. Ở 390 dòng muted xuống hai dòng, căn giữa.
Luật: `verified-experience-per-part.md` (chỉ mục thầy đã ký mới xác minh được), `grammar-slot-interface`, `surface-layering` (trạng thái rỗng nằm thẳng trong vùng, không thẻ).
Grammar: `EmptyNotice` (`composite/EmptyNotice`), `Page`, `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`).

## Kết quả xác minh khi mã hợp lệ

Vì sao: không có trong ảnh, viết từ mã (`VerifyExperience/component.tsx`): một `Alert` "Đã xác minh" (hoặc "Đã thu hồi" kèm ngày), dòng người ký và ngày, dòng CV thầy đã ký, một danh sách mô tả `DescriptionList` gồm phần học, loại bằng chứng và mã, và một ghi chú nhỏ cuối trang. Không hiện điểm, tên hay mã của học viên. Danh sách mô tả nằm phẳng trên trang, không bọc thẻ. CHƯA RÕ: chưa có ảnh của trạng thái này vì dữ liệu chụp chưa có mục nào được thầy xác minh.
Luật: `verified-experience-per-part.md`, `surface-layering` (danh sách chi tiết là phần phẳng).
Grammar: `Alert` (đã xác minh và đã thu hồi), `DescriptionList` (`composite/DescriptionList`), `Text`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, 390, toàn trang: khối thông báo dính sát mép trên (cách đỉnh khoảng 56px) và bên dưới trống đến cuối trang; không có tên thương hiệu StarCi để người lạ biết đây là trang của ai.
- 1440, 390, ô icon hộp thư: nền xám nhạt tô kín thay vì viền; icon nhỏ, xám, tương phản thấp.
- 1440, 390, tiêu đề "Không tìm thấy mã xác minh" cỡ 14 giữa trang, nhỏ so với khoảng trống xung quanh; dòng muted xám nhạt cỡ 14, tương phản thấp.
- 390: dòng muted xuống hai dòng và để chữ "StarCi xác minh." lẻ ở dòng hai; căn giữa nên mép trái lởm chởm.
- 1440, 390: không có hành động nào (về trang chủ, thử mã khác); trạng thái lỗi là ngõ cụt.
