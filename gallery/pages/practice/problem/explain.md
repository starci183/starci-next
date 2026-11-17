---
title: Giải bài, đã nộp sai
route: /practice/{slug}
area: practice
reviewed: 2026-11-18
---

Route: `/practice/{slug}`. Giải bài: đề, mã, kết quả, gợi ý. Nút chính theo trạng thái: Nộp bài, Đang chấm, hoặc Bài tiếp theo khi Accepted. Xem lời giải trước khi Accepted phải xác nhận vì bài không vào kinh nghiệm Luyện code.

## Băng đầu trang

Vì sao: Đường dẫn ba mục, tên bài, dòng độ khó, giới hạn, số gợi ý và vị trí; lệnh Chạy thử (trung tính) và Nộp bài (chính); ba tab Đề bài, Bài nộp, Lời giải.
Luật: `surface-layering`, `theme-and-type`
Grammar: `Page header={{ title, meta, breadcrumbs, actions }}` (`frame/PageHeader`).

## Đề bài và bài làm

Vì sao: Đề đứng trên trang, không thẻ nền; ở 1440 đề bên trái cùng gợi ý dưới nó, mã và kết quả bên phải; ở 390 thứ tự là đề, mã, kết quả, gợi ý bằng một phần tử, đổi chỗ bằng thứ tự CSS.
Luật: `surface-layering`
Grammar: `Grid` không dùng; bố cục lưới nằm trong `classNames.ts` của khối; `Textarea` cho mã (chưa có tô màu cú pháp).

## Kết quả

Vì sao: Dòng kết quả có biểu tượng và một câu, rồi từng test: đúng sai bằng hướng và chữ, không chỉ bằng màu; lỗi biên dịch hiện đầu ra trình biên dịch và không tính lần sai.
Luật: `surface-layering`
Grammar: `Alert` và `Section kind="list"` với `ListRow verdict`.

## Phản biện

Vì sao: Mã chưa có tô màu cú pháp và số dòng (thiếu ở Grammar, đã ghi lại); ở 1440 gợi ý nằm dưới kết quả chứ không dưới đề trừ khi trang đủ rộng.
Luật: `PROJECT-GALLERY-6`
Grammar: không đổi Grammar; chỗ lệch được ghi lại để chủ dự án quyết.
