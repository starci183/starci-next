---
title: Duyệt một mục (chỉ thầy và người duyệt)
route: /review-queue/[itemId]
area: career
reviewed: 2026-11-20
---

Route: `/review-queue/[itemId]`. Mã: `fe/apps/app/src/components/blocks/ReviewItem/component.tsx`. Thầy và người duyệt thấy bảng duyệt của một mục; màn này cần vai đó và một mục thật nên chưa chụp được trên dev (tài khoản thường thấy trạng thái cấm, xem `career/review-item-forbidden`).

## Dải đầu trang

Vì sao: đường dẫn Duyệt kinh nghiệm / Một mục cần duyệt nằm trong `Page header`, thay cho liên kết "quay lại" đứng riêng trước đây.
Luật: `page-header-left-sublabel-xs.md`.
Grammar: `Page header={{ title, breadcrumbs }}`.

## Bảng duyệt

Vì sao: cùng bảng duyệt như hàng chờ: thẻ mục, ba danh sách (Bằng chứng, AI chấm theo tiêu chí, Câu hỏi bảo vệ), ô ghi chú với Xác minh (nút chính) và Trả lại, Thu hồi cho thầy trên mục đã xác minh, rồi Lịch sử.
Luật: `verified-experience-per-part.md`.
Grammar: `SurfaceCard`, `Section kind="list"`, `Textarea`, `Button`.
