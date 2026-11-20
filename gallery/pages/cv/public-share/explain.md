---
title: CV công khai, chia sẻ và ảnh xem trước
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (ảnh chụp: bảng chia sẻ mở). Mã: `fe/apps/app/src/components/blocks/PublicCv/`, ảnh xem trước `app/[locale]/(pages)/(auth)/cv/[slug]/opengraph-image.tsx`.

## Bảng chia sẻ

Vì sao: người xem sao chép liên kết hoặc gửi tới LinkedIn, Facebook, Zalo; ở 390 có thêm "Ứng dụng khác" (bảng chia sẻ của hệ điều hành) khi trình duyệt có. Rộng: cửa sổ nhỏ dưới nút; 390: ngăn kéo từ dưới lên.
Luật: không có dữ liệu mới nào rời trang: liên kết là địa chỉ đang mở, và vẫn chỉ hiện dòng đã ký.
Grammar: `Popover`, `Drawer`, `CopyField`, `Button`.

## Ảnh xem trước khi dán liên kết

Vì sao: tấm 1200×630 mà mạng xã hội và tin nhắn hiện khi dán liên kết: tên, số dòng đã ký, ba dòng đầu, "+N dòng nữa" và vết Luyện xong, AI chấm, Thầy ký. Dựng từ `publicCv` bằng `next/og`; CV không có hoặc riêng tư chỉ ra ảnh chung, không tên.
Luật: `verified-experience.md` điều 7 (không điểm số, không tên người duyệt) và điều 4.
Grammar: `Image`.

## Điểm còn mở

Vì sao: địa chỉ chia sẻ Zalo (`https://zalo.me/share?url=…`) chưa được kiểm với Zalo; nút vẫn mở đúng liên kết CV để người dùng sao chép nếu địa chỉ đó đổi.
Luật: không có dữ liệu mới nào rời trang.
Grammar: `Button`.

## Cập nhật 2026-11-20 (pending-seed)

Trạng thái: chờ chụp lại. Dữ liệu thật đã có (CV của học viên gallery-career-states), nhưng lõi dev chưa chạy bản sửa không trả email làm tên hiển thị (profile-cv.policy publicNameOf); ảnh chụp lại sau khi lõi chạy bản sửa. Mã hiện tại: lọc theo nguồn là Tabs kind="filter" có số đếm, nút một cỡ 40px, isLoading đi từ SlotView xuống từng phần.
