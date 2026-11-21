---
title: Hàng chờ duyệt (chỉ thầy và người duyệt)
route: /review-queue
area: career
reviewed: 2026-11-20
---

Route: `/review-queue`. Mã: `fe/apps/app/src/components/blocks/ReviewQueue/component.tsx`. Người duyệt thấy hàng chờ và bảng duyệt của mục đang chọn; thầy có thêm các lọc Quá hạn, Chưa giao và tab Người duyệt. Màn này cần vai người duyệt hoặc thầy nên chưa chụp được trên dev (tài khoản thường chỉ thấy trạng thái cấm, xem `career/review-queue-forbidden`).

## Dải đầu trang

Vì sao: tên trang và đường dẫn về hồ sơ, như mọi trang khác; trước đây trang không có tiêu đề.
Luật: `page-header-left-sublabel-xs.md`.
Grammar: `Page header={{ title, breadcrumbs }}`.

## Lọc hàng chờ

Vì sao: Chờ duyệt, Quá hạn, Chưa giao (và Người duyệt cho thầy) là các tab lọc có số đếm; Quá hạn mang dấu chú ý khi còn mục.
Luật: `choice-controls.md` (Tabs lọc danh sách).
Grammar: `Tabs kind="filter"` với `count`, `isAttention`.

## Hàng chờ

Vì sao: mỗi mục là một hàng danh sách: câu mô tả, người học và phần, huy hiệu hạn duyệt; bấm hàng để xem bên phải, hàng đang xem có vạch nhấn.
Luật: `rows-in-card.md`, `list-row` một kiểu cho một hàng.
Grammar: `Section kind="list"` với `ListRow badges onPress edgeTone`.

## Bảng duyệt

Vì sao: thẻ mục (phần, người học, trạng thái, dòng AI soạn hai ngôn ngữ), rồi các danh sách Bằng chứng, AI chấm theo tiêu chí, Câu hỏi bảo vệ; sau đó Xác minh (nút chính duy nhất) hoặc Trả lại kèm ghi chú, Thu hồi cho thầy, và Lịch sử.
Luật: `verified-experience-per-part.md`, một nút chính mỗi view.
Grammar: `SurfaceCard`, `Section kind="list"`, `Textarea`, `Button`.

## Người duyệt (thầy)

Vì sao: bổ nhiệm người duyệt và danh sách người đang duyệt, mỗi hàng có nút Kết thúc cao 40px. CHƯA ĐỦ: ô người duyệt vẫn nhận mã người dùng gõ tay; cần API danh sách thành viên để chọn.
Luật: copy tiếng Việt, không mã thô.
Grammar: `Input`, `CheckboxGroup`, `NumberField`, `Section kind="list"`.
