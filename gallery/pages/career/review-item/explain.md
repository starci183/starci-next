---
title: Duyệt một mục (chỉ thầy và người duyệt)
route: /review-queue/[itemId]
area: career
---

Route: `/review-queue/[itemId]` (ảnh chụp: tài khoản học viên thường với một mã mục không có thật, nên thấy trạng thái bị từ chối; thầy mở một mục thật thấy bảng duyệt). Mã: `fe/apps/app/src/components/blocks/ReviewItem/component.tsx`. Khung chung giải thích ở `learn/home`.

## Liên kết "Về hàng chờ"

Vì sao: trang con của `career/review-queue`, đầu trang là liên kết quay lại hàng chờ. CHƯA RÕ: như `agents/track`, liên kết đứng riêng trên nền xám thay vì đường dẫn trong dải `Page`.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Link` (`leaf/Link`) trong `Stack`; cần `Page header.breadcrumbs`.

## Thông báo "Chỉ thầy và người duyệt được mở trang này"

Vì sao: cùng trạng thái cấm của hàng chờ: học viên không có quyền thì cửa dữ liệu trả `forbidden`. Với thầy, vùng này là `ReviewPanel`: dòng CV AI soạn, bằng chứng, ô ghi chú, các lệnh Ký xác nhận và Trả lại; chưa có ảnh vì chưa có tài khoản thầy trong dữ liệu chụp.
Luật: `grammar-slot-interface`, `verified-experience-per-part.md` (thầy ký mới là Đã xác minh).
Grammar: `SlotView` và `ReviewPanel` (`fe/packages/starci-next-ui/src/composites/ReviewPanel`), `EmptyNotice`.
