---
title: Kết quả phỏng vấn
route: /interview/[sessionId]/report
area: interview
reviewed: 2026-11-17
---

Route: `/interview/[sessionId]/report` (ảnh chụp: mở kết quả của một buổi chưa nộp nên thấy trạng thái "chưa có kết quả"; buổi đã chấm hiện điểm và nhận xét từng câu, chưa có ảnh vì chấm cần mô hình AI mà dữ liệu chụp chưa gọi được). Mã: `fe/apps/app/src/components/blocks/InterviewReport/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn và tiêu đề "Kết quả phỏng vấn"

Vì sao: cùng khuôn dải với `interview/session`: đường dẫn "Phỏng vấn thử / Kết quả phỏng vấn" và tiêu đề 18/600. Mục đầu quay về `interview/start`.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Khối "Buổi này chưa có kết quả"

Vì sao: nhãn khối trên một thẻ nền accent nhạt: câu nói buổi chưa được gửi và hãy quay lại làm tiếp, kèm nút chính "Tiếp tục buổi" (một nút chính, đưa về `interview/session`). Đây là trạng thái đúng cho một buổi chưa nộp: không hiện điểm không có thật.
Luật: `verify-against-visualize.md`, `pink-page-surface-rule.md`.
Grammar: `SurfaceCard treatment="soft" label`, `Button intent="commit" href` (`leaf/Button`).

## Bảng kết quả khi buổi đã chấm

Vì sao: không có trong ảnh, viết từ mã: tiêu đề điểm tổng với `Badge` theo mức, lưới (`Grid`) các thẻ câu với điểm, tiêu chí đạt và chưa đạt, và liên kết (`Link`) sang bài học nên ôn lại. Mọi điểm do máy chủ chấm theo đáp án của thầy, trang chỉ vẽ.
Luật: `table-heroui-native-section-head.md`, `verify-against-visualize.md`.
Grammar: `SurfaceCard`, `Grid`, `Heading`, `Badge`, `Cluster`, `Link` (`InterviewReport/component.tsx`). CHƯA RÕ: chưa có ảnh của trạng thái đã chấm; cần một buổi đã chấm trong dữ liệu chụp.
