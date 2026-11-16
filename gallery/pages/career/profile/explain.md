---
title: Hồ sơ của bạn
route: /profile
area: career
---

Route: `/profile` (ảnh chụp: học viên mới, chưa có mục Đã xác minh). Mã: `fe/apps/app/src/components/blocks/ProfileExperience/component.tsx`. Trang đọc, không có lệnh chính; mọi thứ phẳng trên mặt trắng.

## Đầu trang "Hồ sơ của bạn"

Vì sao: đầu trang chuẩn, sát trái: tiêu đề 18/600 và một dòng mô tả 12 muted nói mọi mục dưới đây do StarCi chấm, không tự khai; đường kẻ dưới ngăn với nội dung. Cùng kiểu với `career/experience` và `projects/list`.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering` (tiêu đề 18/600, mô tả 12 muted).
Grammar: `Page header={{ title, description }}` (`frame/Page/index.d.ts`).

## Phần "Kinh nghiệm"

Vì sao: một Section phẳng: dòng muted nói hồ sơ công khai và CV chỉ hiện mục Đã xác minh, dòng đậm "0/3 mục Đã xác minh để được giới thiệu việc làm" (ngưỡng ba mục) và liên kết "Xem tất cả" ở mép phải sang `career/experience`. CHƯA RÕ: trong ảnh chữ "Kinh nghiệm" (đầu mục) nằm dưới hai dòng trên thay vì đứng đầu; đầu mục phải ở trên cùng và "Xem tất cả" nên kết thúc bằng "→". Ở 390 "Xem tất cả" xuống dòng riêng, trái, sát đoạn mô tả.
Luật: `surface-layering` (đầu mục Section, liên kết điều hướng có mũi tên), `verified-experience-per-part.md`, `type-scale-14-12.md`.
Grammar: `Section title labelEnd` và `Link variant="plain"` (`leaf/Link`).

## Chú thích "Xuất CV"

Vì sao: một dòng nhỏ muted nói xuất CV từ các mục đã xác minh sẽ có trong đợt sau, nói thẳng điều chưa làm. CHƯA RÕ: chữ nhỏ hơn cỡ 12 của app và ngả màu nâu đỏ thay vì muted trung tính.
Luật: `type-scale-14-12.md`, `theme-and-type` (neutral không sắc).
Grammar: `Text size="sm" tone="muted"`.
