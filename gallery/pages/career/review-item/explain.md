---
title: Duyệt một mục (chỉ thầy và người duyệt)
route: /review-queue/[itemId]
area: career
reviewed: 2026-11-17
---

Route: `/review-queue/[itemId]` (ảnh chụp: tài khoản học viên thường với một mã mục không có thật, nên thấy trạng thái bị từ chối; thầy mở một mục thật thấy bảng duyệt). Mã: `fe/apps/app/src/components/blocks/ReviewItem/component.tsx`. Trang trắng, không thẻ.

## Liên kết "Về hàng chờ"

Vì sao: trang con của `career/review-queue`, đầu trang là liên kết quay lại, chữ foreground. CHƯA RÕ: liên kết đứng riêng, không có mũi tên và không nằm trong đường dẫn của `Page` như `agents/track`; nên là `Page header.breadcrumbs`.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering` (liên kết điều hướng có mũi tên).
Grammar: `Link variant="plain"` trong `Stack`; cần `Page header.breadcrumbs`.

## Thông báo "Chỉ thầy và người duyệt được mở trang này"

Vì sao: cùng trạng thái cấm của hàng chờ: ô icon hộp thư xám nhạt và một câu giữa trang. Với thầy, vùng này là bảng duyệt: dòng CV AI soạn, bằng chứng, ô ghi chú và các lệnh Ký xác nhận, Trả lại (một nút chính); chưa có ảnh vì chưa có tài khoản thầy trong dữ liệu chụp.
Luật: `grammar-slot-interface`, `verified-experience-per-part.md` (thầy ký mới là Đã xác minh).
Grammar: `SlotView`, `EmptyNotice`; bảng duyệt là `ReviewPanel` (`fe/packages/starci-next-ui/src/composites/ReviewPanel`).

## Phản biện

- 1440: liên kết "Về hàng chờ" đứng lẻ ở đầu trang, chữ foreground không có mũi tên và không nằm trong đường dẫn của dải tiêu đề; trang không có tiêu đề hay dải đầu trang.
- 1440: ô icon hộp thư và câu căn giữa trong khi liên kết căn trái ở x=288; hai trục lệch nhau.
- 1440: mục không có thật và người không có quyền cùng một thông báo, không nói vì sao bị cấm.
- 1920: liên kết ở x=480 còn câu giữa vùng (x=1088); khoảng trống rất lớn, vẫn không có tiêu đề hay dải trang.
- 390: liên kết "Về hàng chờ" là chữ foreground thường, không gạch chân, không mũi tên nên không có dấu hiệu là liên kết; câu gần khít hai mép khi ngắt dòng; không có đầu trang.
