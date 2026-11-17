---
title: Hồ sơ của bạn
route: /profile
area: career
reviewed: 2026-11-17
---

Route: `/profile` (ảnh chụp: học viên mới, chưa có mục Đã xác minh). Mã: `fe/apps/app/src/components/blocks/ProfileExperience/component.tsx`. Trang đọc, không có lệnh chính; mọi thứ phẳng trên mặt trắng.

## Đầu trang "Hồ sơ của bạn"

Vì sao: đầu trang chuẩn, sát trái: tiêu đề 18/600 và một dòng mô tả 12 muted nói mọi mục dưới đây do StarCi chấm, không tự khai; đường kẻ dưới ngăn với nội dung. Cùng kiểu với `career/experience` và `projects/list`.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering` (tiêu đề 18/600, mô tả 12 muted).
Grammar: `Page header={{ title, description }}` (`frame/Page/index.d.ts`).

## Phần "Kinh nghiệm"

Vì sao: một Section phẳng: dòng muted nói hồ sơ công khai và CV chỉ hiện mục Đã xác minh, dòng đậm "0/3 mục Đã xác minh để được giới thiệu việc làm" (ngưỡng ba mục) và liên kết "Xem tất cả" sang `career/experience`. Đầu mục "Kinh nghiệm" đứng trên cùng; "Xem tất cả" nằm ngay sau dòng muted trên cùng hàng chứ không ở mép phải (chưa có mũi tên "→"). Ở 390 "Xem tất cả" xuống dòng riêng, trái, sát đoạn mô tả.
Luật: `surface-layering` (đầu mục Section, liên kết điều hướng có mũi tên), `verified-experience-per-part.md`, `type-scale-14-12.md`.
Grammar: `Section title labelEnd` và `Link variant="plain"` (`leaf/Link`).

## Chú thích "Xuất CV"

Vì sao: một dòng nhỏ muted nói xuất CV từ các mục đã xác minh sẽ có trong đợt sau, nói thẳng điều chưa làm. CHƯA RÕ: chữ nhỏ hơn cỡ 12 của app và ngả màu nâu đỏ thay vì muted trung tính.
Luật: `type-scale-14-12.md`, `theme-and-type` (neutral không sắc).
Grammar: `Text size="sm" tone="muted"`.

## Phản biện

- 1440: Section "Kinh nghiệm": "Xem tất cả" đứng ngay sau dòng muted cùng hàng (không ở mép phải đầu mục), chữ foreground không gạch chân, không mũi tên "→" nên nhìn như phần của câu.
- 1440: dòng đậm "0/3 mục Đã xác minh để được giới thiệu việc làm" cùng cỡ với đầu mục nên cạnh tranh với đầu mục "Kinh nghiệm"; không có thanh tiến độ hay chip để đọc nhanh số.
- 1440: ghi chú "Xuất CV từ các mục đã xác minh sẽ có trong đợt sau." nhỏ hơn 12 và ngả nâu đỏ, trái luật 12 muted trung tính.
- 1440: trang trống dưới dòng đó; không có trạng thái rỗng nói hồ sơ chưa có mục nào hay lối tới "Kinh nghiệm đã xác minh".
- 1920: nội dung ở x=480 trong khi tiêu đề trang sát trái x=288; lệch trục. Các lỗi liên kết không mũi tên, chữ nhỏ ngả nâu giữ nguyên.
- 390: "Xem tất cả" xuống dòng riêng sát dưới đoạn mô tả, nhìn như một dòng đậm thay vì liên kết; ghi chú cuối chữ nhỏ ngả nâu.
