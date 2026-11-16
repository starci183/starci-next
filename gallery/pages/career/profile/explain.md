---
title: Hồ sơ của bạn
route: /profile
area: career
---

Route: `/profile` (ảnh chụp: học viên mới, chưa có mục Đã xác minh). Mã: `fe/apps/app/src/components/blocks/ProfileExperience/component.tsx`. Khung chung giải thích ở `learn/home`.

## Thẻ đầu trang "Hồ sơ của bạn"

Vì sao: thẻ trắng nổi mở trang: tiêu đề và một dòng muted nói mọi mục dưới đây do StarCi chấm, không tự khai. Là thẻ chứ không phải dải vì hồ sơ là trang đọc, không có lệnh chính. CHƯA RÕ: các trang khác dùng dải `Page header`, trang này dùng thẻ nên tiêu đề lệch cỡ so với `career/experience` và `projects/list`; cần thống nhất một kiểu đầu trang.
Luật: `pink-page-surface-rule.md`, `page-header-left-sublabel-xs.md`.
Grammar: `Page` bọc `SurfaceCard` với `Heading` và `Text tone="muted"`.

## Phần "Kinh nghiệm"

Vì sao: nhãn khối "Kinh nghiệm" trên một thẻ: dòng muted nói hồ sơ công khai và CV chỉ hiện mục Đã xác minh, dòng đậm "0/3 mục Đã xác minh để được giới thiệu việc làm" (ngưỡng ba mục) và liên kết "Xem tất cả" bên phải đưa tới `career/experience`. Dưới thẻ là chú thích nhỏ rằng xuất CV sẽ có đợt sau, nói thẳng điều chưa làm.
Luật: `table-heroui-native-section-head.md` (nhãn trên thẻ), `verified-experience-per-part.md`, `type-scale-14-12.md`.
Grammar: `SurfaceCard label`, `Link` (`leaf/Link`), `Badge`/`Cluster` cho các mục khi đã có.
