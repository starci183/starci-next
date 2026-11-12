---
title: Bản chất / Idempotency / Bị hỏi
route: /essentials/api-reliability/idempotency?phase=challenge
area: essentials
---

Route: `/essentials/[topic]/[lesson]?phase=challenge`. Chụp bằng người học Premium (state của `scripts/gallery-sign-in.cjs`), 1440. Thiết kế gốc: canvas 6 artboard của lane STARCI-NEXT-6STEP-REDESIGN-20261111.

## Band (ảnh 3D của pha, breadcrumbs, "Pha: câu hỏi", meta, stepper 6 bước)

Vì sao: mỗi trang pha có band riêng theo canvas: ảnh 3D của bước ở đầu (Mascot size lg, khung vuông 240 vì Grammar chưa có chỗ cho ảnh band 210x140 bo góc), breadcrumbs, tiêu đề "<Pha>: <tiêu đề phần mở>", dòng meta 12 muted ("Pha n/6 · phần i/m · miễn phí"), rồi Stepper 6 bước: xong = vòng xanh có dấu check, hiện tại = vòng tô màu nhấn, sau = vòng mờ. Bấm một bước thì mở pha đó. Stepper thay hàng tab trang của bản cũ nên header không còn `tabs`/`subTabs`.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header { breadcrumbs, title, mark: Mascot, meta, description: Stepper }` (`core/frame/PageHeader`, `core/leaf/Mascot`, `core/composite/Stepper`).

## Thẻ tình huống + thẻ câu trả lời

Vì sao: tình huống là thẻ đọc bằng Grammar `Markdown` (từ markdown gốc của bài); thẻ câu trả lời là một việc nộp bài với nút "Nộp câu trả lời". Câu trả lời đã nộp được giữ trong trình duyệt để ô nhập không trống sau khi tải lại.
Luật: `pink-page-surface-rule.md`.
Grammar: `Markdown`, `SurfaceCard`, `Textarea` (`WrittenCard`).

## Thẻ "Kết quả chấm"

Vì sao: thẻ list riêng sau thẻ nộp bài, còn nguyên sau khi tải lại (đọc từ lần nộp mới nhất của server): mỗi hàng một tiêu chí rubric, Badge mức (Đạt / Một nửa / Chưa có), dòng 14 muted "Thiếu: ..." khi chưa đủ (server chưa gửi trường này nên hiện rơi về trích đoạn bài làm), đầu thẻ có điểm "2/6 · đã lưu HH:mm".
Luật: ruling "Dùng sẵn có" (Badge không `isDot`, không biến thể mới).
Grammar: `SurfaceCard kind="list" { label, fact, items[].badges }` (`components/blocks/LessonStudy/results.tsx`).

## Pha trước / Tiếp

Vì sao: cuối mỗi pha có "Pha trước" (neutral) bên trái và đúng một nút tím "Tiếp: <pha sau>" bên phải (CTA chính duy nhất của view; `startGlyph="arrow-end"` vì nút chính không được mang mũi tên cuối).
Luật: UI brief: một CTA tím mỗi view.
Grammar: `Button intent="commit" startGlyph="arrow-end"`, `Button intent="neutral"`, `Cluster justify="between"`.

## Aside "Tiến độ bài" (kết quả từng pha, kết quả học tập, ôn tập)

Vì sao: mặt trắng phẳng, đường kẻ giữa các mục. Mục kết quả từng pha (Bị hỏi 2/6 · đã lưu, Dự đoán Đúng...) chỉ hiện pha đã làm; "Kết quả học tập" mỗi hàng một kết quả với Badge Đang học / Đã hiểu / Cần ôn (không `isDot`, theo ruling "Dùng sẵn có") và một dòng quy tắc 12 muted: "Đã hiểu" cần 4/6 ở Áp dụng và Phỏng vấn lại, đúng ở Dự đoán chưa tính; "Ôn tập" mở sau khi hoàn thành 6 pha, khi đó là ba hàng Sau 1/7/21 ngày với ngày đến hạn. Aside đọc lại tiến độ ngay sau mỗi lần nộp nên đổi mà không cần tải trang.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Section kind="list" { items[].badges, caption }`, `Divider`, `PaneSection` (`components/blocks/LessonStudy/aside.tsx`).
