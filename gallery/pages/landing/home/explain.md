---
title: Trang giới thiệu (landing)
route: /
area: landing
---

Route: `/` của ứng dụng `landing` (cổng riêng, không phải ứng dụng học). Mã: `fe/apps/landing/src/app/[locale]/page.tsx`. Đây là trang khung của bộ dựng: chưa có thiết kế sản phẩm.

## Dải thương hiệu "starci-next"

Vì sao: một dải trắng cao một hàng, viền dưới, chỉ có tên dự án bằng chữ thường ở góc trái; không logo, không điều hướng, không đổi ngôn ngữ. CHƯA RÕ: ứng dụng học dùng logo StarCi và thanh trên có đổi ngôn ngữ, giao diện sáng tối; landing dùng chữ thường trần "starci-next" nên không cùng thương hiệu.
Luật: `pink-page-surface-rule.md`, `nivo-surface-layering.md` (chrome phẳng, chỉ viền).
Grammar: `TopBar` chưa dùng; dải là khung dựng sẵn của bộ dựng (`fe/apps/landing/src/features`).

## Dải tiêu đề "Chào mừng đến với starci-next"

Vì sao: dải trắng phẳng, viền dưới, tiêu đề 18/600 sát trái: lời chào chung của khung. CHƯA RÕ: không nói StarCi Next là gì, cho ai, học gì; đây là chữ mặc định của bộ dựng chứ chưa phải lời giới thiệu sản phẩm.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title }}` (`frame/Page/index.d.ts`).

## Đoạn mô tả và nút "Mở ứng dụng"

Vì sao: một dòng muted "Mọi thứ bạn cần đều ở trong ứng dụng." và MỘT nút chính "Mở ứng dụng" dẫn sang ứng dụng học. Nút có màu xanh nhạt của chủ đề mặc định, khác với màu tím accent của ứng dụng học. CHƯA RÕ: màu nút và nền xám nhạt chưa theo bộ màu chủ sở hữu duyệt (`owner-colors-exact.md`); landing chưa nạp cùng token với ứng dụng học.
Luật: `verify-against-visualize.md` (một nút chính), `owner-colors-exact.md`.
Grammar: `Button intent="commit" href` (`leaf/Button`).
