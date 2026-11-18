---
title: CV công khai, không có hoặc riêng tư
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (ảnh chụp: địa chỉ gõ sai). Mã: `fe/apps/app/src/components/blocks/PublicCv/`, `app/[locale]/(auth)/cv/[slug]/not-found.tsx`. Trang trả HTTP 404 và `noindex`; ảnh xem trước của liên kết này là ảnh chung của StarCi, không có tên.

## Không có CV ở địa chỉ này

Vì sao: slug sai, slug sai mẫu và CV để riêng tư cho cùng một câu, để người ngoài không đoán được ai có CV; nhắc hỏi lại người gửi liên kết; hiện lại địa chỉ đã mở để người xem thấy chỗ gõ sai. Không có nút thử lại vì đây không phải lỗi mạng.
Luật: `verified-experience.md` điều 4 (chỉ CV mà học viên bật Công khai mới hiện) và điều 7.
Grammar: `EmptyNotice`, `CopyField`.

## Thanh trên công khai

Vì sao: như `cv/public`.
Luật: route nằm trong nhóm `(auth)`, không có phiên.
Grammar: `BrandLockup`, `Button` neutral.
