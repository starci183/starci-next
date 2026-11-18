---
title: Landing, đã xảy ra lỗi
route: /{locale}/{trang lỗi}
area: landing
---

Route: bất kỳ trang nào dưới một ngôn ngữ mà việc vẽ trang ném lỗi (ảnh chụp dùng một trang thử ném lỗi tạm, không nằm trong mã). Mã: `fe/apps/landing/src/app/[locale]/error.tsx`, `features/pages/LandingErrorPage`. Bản cuối cùng khi chính khung lỗi: `app/global-error.tsx`, `LandingGlobalErrorPage`.

## Thanh thương hiệu

Vì sao: dải trên vẫn hiện vì lỗi chỉ thay phần thân của trang.
Luật: `surface-layering`.
Grammar: `LocaleShell` của `@starci-next/ui`.

## Trạng thái lỗi

Vì sao: một trạng thái cấp trang có hình, câu nói có sự cố khi tải trang này, nút chính "Về trang chủ" và một nút phụ "Thử lại" để vẽ lại ngay; lỗi này có thể qua đi nên cần thử lại.
Luật: `surface-layering` (một nút chính, một nút phụ).
Grammar: `EmptyNotice scope="page"` với `secondary` qua `ErrorNotice` của `@starci-next/ui`.
