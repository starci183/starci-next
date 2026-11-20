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

Trạng thái: pending-seed. Màn này cần dữ liệu thật mà dev DB chưa có (mục kinh nghiệm đã xác minh, CV công khai). Lane next-gallery-seed gieo dữ liệu; ảnh chụp sẽ được chụp lại khi đó. Mã hiện tại đã theo luật Grammar 0.50 (nút một cỡ 40px, Tabs filter cho bộ lọc, isLoading từ SlotView).
