---
title: Ứng dụng học, đã xảy ra lỗi
route: /{locale}/{trang lỗi}
area: learn
---

Route: bất kỳ trang nào dưới một ngôn ngữ mà việc vẽ trang ném lỗi (ảnh chụp dùng một trang thử ném lỗi tạm, không nằm trong mã). Mã: `fe/apps/app/src/app/[locale]/error.tsx`, `features/pages/AppErrorPage`. Bản cuối cùng khi chính khung lỗi: `app/global-error.tsx`, `AppGlobalErrorPage`.

## Khung trang trống

Vì sao: lỗi thay cả phần thân của trang nên không còn thanh điều hướng; chỉ có trạng thái lỗi giữa màn hình.
Luật: `surface-layering`.
Grammar: `LocaleShell` của `@starci-next/ui` (chỉ khung tài liệu, không có thanh).

## Trạng thái lỗi

Vì sao: một trạng thái cấp trang có hình, câu nói có sự cố khi tải trang này, nút chính "Về trang chủ" và một nút phụ "Thử lại" để vẽ lại ngay; lỗi này có thể qua đi nên cần thử lại.
Luật: `surface-layering` (một nút chính, một nút phụ).
Grammar: `EmptyNotice scope="page"` với `secondary` qua `ErrorNotice` của `@starci-next/ui`.
