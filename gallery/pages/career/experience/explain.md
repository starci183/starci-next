---
title: Hồ sơ · kinh nghiệm đã xác minh
route: /experience
area: career
---

Route: `/experience` (ảnh chụp: năm mục, đủ các trạng thái). Mã: `fe/apps/app/src/components/blocks/ExperienceList/`. Trạng thái khác: `career/experience-first`, `career/experience-tab-empty`, `career/experience-confirm`, `career/experience-error`, `career/experience-loading`, `career/experience-claim`. Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Mục tiêu

Vì sao: biến phần đã học thành dòng CV có chữ ký, theo dõi từng mục tới khi thầy ký. Đường dẫn "Hồ sơ / Kinh nghiệm", dòng sự kiện dưới tiêu đề ("2 đã xác minh · 1 đang chờ thầy · Cần 3 mục đã xác minh để được giới thiệu việc làm").
Luật: `verified-experience.md` (chỉ mục Đã xác minh vào hồ sơ và CV).
Grammar: `Page header` có `breadcrumbs` và `tabs`.

## Tab trạng thái và chip nguồn

Vì sao: tab có đếm cho Tất cả, Đã xác minh, Chờ thầy duyệt, AI đã chấm, Bị trả lại (phần thừa vào "+n"); chip nguồn Mọi nguồn, Essentials, Dự án, Harness, Luyện code, mỗi chip có đếm.
Grammar: tab của `Page header`, `ChoiceChips`.

## Mỗi mục là một thẻ viền mảnh

Vì sao: nguồn và trạng thái ở đầu thẻ, ngày ký hoặc gửi ở cuối dòng đầu, rồi tiêu đề, chủ đề, chip bằng chứng, hành động tiếp theo. Mục Đã xác minh có công tắc Công khai và nút Sao chép liên kết. Mục chờ thầy chỉ nói "Thầy đang xem, chưa cần làm gì". Mục AI đã chấm mở ô sửa dòng CV hai thứ tiếng kèm chip điểm AI và số câu bảo vệ; "Gửi thầy duyệt" hỏi xác nhận vì gửi xong khóa dòng CV. Mục bị trả lại hiện "Lời thầy" trong ô vàng và nút "Sửa dòng CV và gửi lại".
Grammar: `SurfaceCard`, `Badge`, `Switch`, `Textarea`, `Alert`, `AlertDialog`.

## Luyện code

Vì sao: pattern đã Accepted hết nhưng chưa nhận kinh nghiệm hiện ở cuối trang với nút "Nhận kinh nghiệm" (`claimPracticeExperience`). Bài đã xem lời giải trước khi Accepted không được tính.
Grammar: `Section kind="list"` + `ListRow action`.

## Lần đầu và tab rỗng

Vì sao: chưa có mục nào thì nói một lần ("Mỗi phần học cho bạn một dòng kinh nghiệm") rồi bốn lối vào; tab không có mục có chỉ dẫn và nút "Xem tất cả".
Grammar: `Alert tone="informative"`, `EmptyNotice`.

## Cập nhật 2026-11-20 (pending-seed)

Vì sao: Trạng thái: pending-seed. Màn này cần dữ liệu thật mà dev DB chưa có (mục kinh nghiệm đã xác minh, CV công khai). Lane next-gallery-seed gieo dữ liệu; ảnh chụp sẽ được chụp lại khi đó. Màn danh sách có thẻ (đã xác minh, chờ thầy, AI đã chấm, bị trả lại). Mã hiện tại: lọc theo nguồn là Tabs kind="filter" có số đếm; nút Gửi duyệt trong thẻ là nút trung tính; tiêu đề thẻ là nhãn của SurfaceCard; meta, tab trạng thái và dòng xác nhận lấy từ view đã dựng, không rẽ nhánh theo slot.
Luật: Grammar 0.50, một nút chính mỗi màn, nút một cỡ 40px, bộ lọc một danh sách là Tabs kind="filter" (quyết định điều phối 20/11), ảnh chụp chỉ dùng dữ liệu thật.
Grammar: `SurfaceCard`, `Tabs kind="filter"`, `Section kind="list"`, `Button`, `Alert`
