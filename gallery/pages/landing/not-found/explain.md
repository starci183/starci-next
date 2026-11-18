---
title: Landing, không tìm thấy trang
route: /{locale}/{đường dẫn không có}
area: landing
---

Route: mọi địa chỉ dưới một ngôn ngữ mà không trang nào nhận (ảnh chụp: `/vi/khong-co-trang-nay`). Mã: `fe/apps/landing/src/app/[locale]/[...rest]/page.tsx` gọi `notFound()`, `app/[locale]/not-found.tsx` vẽ trang; `app/not-found.tsx` là bản gốc cho địa chỉ không thuộc ngôn ngữ nào. Trả HTTP 404.

## Thanh thương hiệu

Vì sao: giữ nguyên dải trên của landing để người gõ sai vẫn biết mình đang ở đâu.
Luật: `surface-layering` (chrome trắng, phẳng, chỉ đường kẻ).
Grammar: `LocaleShell` của `@starci-next/ui` (khung dựng sẵn của landing).

## Trạng thái không tìm thấy

Vì sao: một trạng thái cấp trang, có hình minh hoạ, một câu nói trang không còn ở đây hoặc đường dẫn gõ sai, và MỘT nút "Về trang chủ"; không có nút thử lại vì đây không phải lỗi mạng. Chữ theo ngôn ngữ của địa chỉ.
Luật: `surface-layering` (một nút chính).
Grammar: `EmptyNotice scope="page"` (`composite/EmptyNotice`) qua `NotFoundNotice` của `@starci-next/ui`.
