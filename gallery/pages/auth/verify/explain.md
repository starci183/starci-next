---
title: Xác minh công khai một kinh nghiệm
route: /verify/[code]
area: auth
---

Route: `/verify/[code]` (ảnh chụp: một mã đúng định dạng nhưng StarCi chưa từng xác minh, nên thấy trạng thái "không tìm thấy"). Trang công khai, không cần đăng nhập, nên không có thanh bên và thanh trên. Mã: `fe/apps/app/src/components/blocks/VerifyExperience/component.tsx` (vẽ), `index.tsx` (đọc, không có phiên).

## Thông báo "Không tìm thấy mã xác minh"

Vì sao: người nhận CV mở liên kết do học viên gửi; mã không khớp thì trang nói thẳng bằng một ô icon hộp thư, tiêu đề "Không tìm thấy mã xác minh" và dòng muted "Mã này không khớp với kinh nghiệm nào đã được StarCi xác minh." Trang không bao giờ đoán hay hiện một kết quả gần đúng. Một mã sai định dạng (không phải ba nhóm bốn chữ hoặc số) cũng đọc thành "không tìm thấy" chứ không còn là lỗi chung "Không tải được phần này": đã sửa ở `VerifyExperience/index.tsx` (`NOT_FOUND_CODES`, thêm `HTTP_SECURITY_REQUEST_INVALID`) và chụp lại. CHƯA RÕ: thông báo dính sát mép trên trang, không có tên thương hiệu StarCi để người lạ biết trang của ai; nên có một dòng thương hiệu ở đầu.
Luật: `verified-experience-per-part.md` (chỉ mục thầy đã ký mới xác minh được), `grammar-slot-interface`.
Grammar: `EmptyNotice` (`composite/EmptyNotice`), `Page`, `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`).

## Thẻ xác minh khi mã hợp lệ

Vì sao: không có trong ảnh, viết từ mã: một thẻ với tiêu đề "Đã xác minh" (hoặc "Đã thu hồi" kèm ngày), dòng phụ nói người ký và ngày, dòng CV thầy đã ký, một danh sách mô tả (`DescriptionList`) gồm phần học, loại bằng chứng và mã, và một ghi chú nhỏ cuối trang. Trang không hiện điểm, tên hay mã của học viên. CHƯA RÕ: chưa có ảnh của trạng thái này vì dữ liệu chụp chưa có mục nào được thầy xác minh.
Luật: `verified-experience-per-part.md`, `pink-page-surface-rule.md`.
Grammar: `SurfaceCard`, `Alert` (cho trạng thái đã thu hồi), `DescriptionList` (`composite/DescriptionList`), `Text`.
