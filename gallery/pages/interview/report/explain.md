---
title: Kết quả phỏng vấn
route: /interview/[sessionId]/report
area: interview
---

Route: `/interview/[sessionId]/report` (ảnh chụp: mở kết quả của một buổi chưa nộp nên thấy trạng thái "chưa có kết quả"; buổi đã chấm hiện điểm và nhận xét từng câu, chưa có ảnh vì chấm cần mô hình AI mà dữ liệu chụp chưa gọi được). Mã: `fe/apps/app/src/components/blocks/InterviewReport/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn và tiêu đề "Kết quả phỏng vấn"

Vì sao: cùng khuôn dải với `interview/session`: đường dẫn "Phỏng vấn thử / Kết quả phỏng vấn" và tiêu đề 18/600. Mục đầu quay về `interview/start`.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Khối "Buổi này chưa có kết quả"

Vì sao: một `Section` phẳng trên nền trắng, không thẻ: câu nói buổi chưa được gửi và hãy quay lại làm tiếp, kèm nút chính pill "Tiếp tục buổi" (nút chính duy nhất, đưa về `interview/session`). Đây là trạng thái đúng cho một buổi chưa nộp: không hiện điểm không có thật. Trang chỉ có khối này nên phần dưới trống.
Luật: `surface-layering` (một nút chính, Section thay thẻ), `theme-and-type`.
Grammar: `InterviewReportNotice` (`fe/packages/starci-next-ui/src/composites/InterviewReportNotice`) gồm `Section`, `Text`, `Button intent="commit" href` (`leaf/Button`).

## Bảng kết quả khi buổi đã chấm

Vì sao: không có trong ảnh, viết từ mã: dải điểm tổng và hai trụ là một ribbon số liệu trên nền trắng (đường kẻ trên và dưới), rồi delta và ghi chú dự phòng; mỗi câu là một thẻ `InterviewQuestionCard` (vật thật) với điểm, tiêu chí đạt và chưa đạt, và liên kết (`Link`) sang bài học nên ôn lại. Mọi điểm do máy chủ chấm theo đáp án của thầy, trang chỉ vẽ. CHƯA RÕ: chưa có ảnh của trạng thái đã chấm; cần một buổi đã chấm trong dữ liệu chụp.
Luật: `surface-layering` (ribbon cho dải điểm, thẻ chỉ cho câu hỏi), `theme-and-type`.
Grammar: `Section kind="figures" ribbon` (`ScoreHeader`), `InterviewQuestionCard`, `Badge`, `Cluster`, `Link` (`InterviewReport/component.tsx`).
