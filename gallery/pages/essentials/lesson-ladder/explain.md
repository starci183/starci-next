---
title: Bài Essentials · phần 4 Tự áp dụng
route: /essentials/[topic]/[lesson]?part=apply
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=apply`. Mục tiêu: tự áp dụng qua bốn mức Dễ, Vừa, Khó, Siêu khó; mỗi mức chỉ mở khi mức dưới xong. Dữ liệu: lesson(id).essential.challenges, lessonChallengeScores (điểm 100 theo từng mục, isLocked và isPassed do backend trả, trang không tính lại; luật mở mức: mọi kịch bản ẩn của mức dưới đều xanh), submitLessonAttempt cho câu chốt thiết kế. Nút chính: Chạy lại mức Vừa (sao chép lệnh chạy ẩn).

## Bốn mức, mở lần lượt

Vì sao: danh sách phẳng bốn hàng: tên mức, một dòng đề, nhãn trạng thái (Đã xanh, Đang luyện · 70/100, Mở sau khi xong mức trước); hàng đang chọn tô xám theo bản vẽ (chưa có trong Grammar). Khóa do lessonChallengeScores.isLocked trả, trang không tính lại.
Luật: `learner-cli-relay` (RELAY_CHALLENGE_LOCKED), `ui/components/list-table.md`.
Grammar: `Section kind="list"`, `ListRow badges onPress state`. Code: `EssentialApply/index.tsx`.

## Chi tiết mức: đề và Terminal

Vì sao: đề bài, rồi Terminal ghi lệnh chạy ẩn, số kịch bản ẩn đạt, điểm và từng kịch bản ✓ ✗.
Luật: `ui/components/data-views.md`.
Grammar: `RichMarkdown`, `Terminal`.

## Thang điểm · 100

Vì sao: mỗi tiêu chí một hàng: nội dung, điểm đạt trên điểm tối đa (20/20), chip Trọng yếu, mép xanh hoặc đỏ theo đạt hay không; tổng khớp 100.
Luật: `ui/components/list-table.md` (verdict).
Grammar: `ListRow value badges verdict`. Code: `EssentialApply/index.tsx` `Rubric`.

## Chốt thiết kế

Vì sao: câu chọn chấm ngay của mức, dùng cùng thẻ câu hỏi của Bản chất.
Luật: `essentials` luật 2.
Grammar: `LessonQuestion` (`composites/LessonEssence`).

## Từ Đang luyện tới Đã chứng minh

Vì sao: chuỗi năm bước: chạy ẩn trên máy, đẩy lên GitHub, CI chạy kịch bản ẩn, GitHub ký OIDC, Đã chứng minh; chỉ CI có chữ ký mới chứng minh, bước hiện tại là chạy trên máy.
Luật: `learner-cli-relay`, `verified-experience`.
Grammar: `Stepper`.

## Cột phải: Điểm của bạn, Dòng hồ sơ

Vì sao: điểm lớn trên tối đa kèm thanh, và dòng hồ sơ sẽ có (chưa có tới khi CI chứng minh; backend chưa có bằng chứng OIDC cho bài).
Luật: `profile-progress`.
Grammar: `Text size="figure"`, `Meter`. Code: `EssentialApply/Aside.tsx`.

## Nút chính

Vì sao: Chạy lại mức Vừa: sao chép lệnh `starci-next run <bài> --challenge <mức>` cho terminal của học viên.
Luật: `ui/components/button.md`.
Grammar: `Button intent="commit"`. Code: `parts/PrimaryAction.tsx`.

## Phản biện

Vì sao: tự phản biện của lần chụp này trên stand-in core (dữ liệu mẫu của bản vẽ); liệt kê điều còn lệch với khung đã duyệt.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Ngưỡng 80/100 và mục trọng yếu của bản vẽ (QUESTIONS #1) không phải luật mở mức: backend mở khi mọi kịch bản ẩn của mức dưới xanh; lời trên trang theo backend.
- Hàng mức đang chọn không có nền xám (ListRow không có tint).
- Nhãn Đã chứng minh chưa bao giờ hiện vì backend chưa có bằng chứng OIDC cho bài.
- Rubric không có chấm tròn xanh/đỏ như bản vẽ: Grammar vẽ mép màu của verdict.
