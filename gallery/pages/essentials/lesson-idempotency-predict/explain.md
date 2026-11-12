---
title: Bản chất / Idempotency / Dự đoán
route: /essentials/api-reliability/idempotency?phase=predict
area: essentials
---

Route: `/essentials/[topic]/[lesson]?phase=predict`. Chụp bằng người học Premium (state của `sign-in.cjs`), 1440. Thiết kế gốc: canvas 6 artboard của lane STARCI-NEXT-6STEP-REDESIGN-20261111.

## Band (ảnh 3D của pha, breadcrumbs, "Pha: câu hỏi", meta, stepper 6 bước)

Vì sao: mỗi trang pha có band riêng theo canvas: ảnh 3D của bước ở đầu (Mascot size lg, khung vuông 240 vì Grammar chưa có chỗ cho ảnh band 210x140 bo góc), breadcrumbs, tiêu đề "<Pha>: <tiêu đề phần mở>", dòng meta 12 muted ("Pha n/6 · phần i/m · miễn phí"), rồi Stepper 6 bước: xong = vòng xanh có dấu check, hiện tại = vòng tô màu nhấn, sau = vòng mờ. Bấm một bước thì mở pha đó. Stepper thay hàng tab trang của bản cũ nên header không còn `tabs`/`subTabs`.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header { breadcrumbs, title, mark: Mascot, meta, description: Stepper }` (`core/frame/PageHeader`, `core/leaf/Mascot`, `core/composite/Stepper`).

## Thẻ chọn một đáp án + thẻ "Vì sao"

Vì sao: ChoiceCard giữ nhãn đáp án; lời giải từng lựa chọn không còn là dòng phụ 12 mờ (lỗi "chữ quá nhạt") mà là thẻ "Vì sao" riêng: mỗi hàng là một đáp án, Badge "Đúng" ở đáp án đúng, lời giải là chữ nền chính (Markdown compact). Lựa chọn đã nộp được khôi phục từ kết quả chấm lưu trên server.
Luật: `type-scale-14-12.md` (phân cấp bằng độ đậm, không bằng chữ mờ).
Grammar: `SurfaceCard kind="select"`, `SurfaceCard kind="list" { items[].detail: Markdown }`.

## Pha trước / Tiếp

Vì sao: cuối mỗi pha có "Pha trước" (neutral) bên trái và đúng một nút tím "Tiếp: <pha sau>" bên phải (CTA chính duy nhất của view; `startGlyph="arrow-end"` vì nút chính không được mang mũi tên cuối).
Luật: UI brief: một CTA tím mỗi view.
Grammar: `Button intent="commit" startGlyph="arrow-end"`, `Button intent="neutral"`, `Cluster justify="between"`.

## Aside "Tiến độ bài" (kết quả từng pha, kết quả học tập, ôn tập)

Vì sao: mặt trắng phẳng, đường kẻ giữa các mục. Mục kết quả từng pha (Bị hỏi 2/6 · đã lưu, Dự đoán Đúng...) chỉ hiện pha đã làm; "Kết quả học tập" mỗi hàng một kết quả với Badge Đang học / Đã hiểu / Cần ôn (không `isDot`, theo ruling "Dùng sẵn có") và một dòng quy tắc 12 muted: "Đã hiểu" cần 4/6 ở Áp dụng và Phỏng vấn lại, đúng ở Dự đoán chưa tính; "Ôn tập" mở sau khi hoàn thành 6 pha, khi đó là ba hàng Sau 1/7/21 ngày với ngày đến hạn. Aside đọc lại tiến độ ngay sau mỗi lần nộp nên đổi mà không cần tải trang.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Section kind="list" { items[].badges, caption }`, `Divider`, `PaneSection` (`components/blocks/LessonStudy/aside.tsx`).
