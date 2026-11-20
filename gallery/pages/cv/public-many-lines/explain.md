---
title: CV công khai, nhiều dòng
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (ảnh chụp: 14 dòng). Mã: `fe/apps/app/src/components/blocks/PublicCv/`.

## Dòng CV đã ký

Vì sao: nhà tuyển dụng thường tìm một mảng (dự án, sự cố): từ 8 dòng hiện chip nguồn có đếm, một chạm là lọc. Danh sách hiện 10 dòng (390: 6) rồi "Xem thêm" mở tiếp tại chỗ, không đổi trang. Nguồn Luyện code là một nguồn như các nguồn khác: cả nhóm bài Accepted thành một dòng, bài đã xem lời giải trước khi Accepted không tính.
Luật: `verified-experience.md` điều 10 (số bài là bằng chứng của dòng, không tự thành dòng CV) và điều 4.
Grammar: `ChoiceChips`, `Section kind="list"` + `ListRow`, `Button`.

## Chủ CV

Vì sao: như `cv/public`; dòng sự kiện nói "14 dòng đã ký".
Luật: `verified-experience.md` điều 7.
Grammar: `Avatar`, `Heading`, `Text`, `Button`.

## Cập nhật 2026-11-20 (pending-seed)

Vì sao: Trạng thái: pending-seed. Màn này cần dữ liệu thật mà dev DB chưa có (mục kinh nghiệm đã xác minh, CV công khai). Lane next-gallery-seed gieo dữ liệu; ảnh chụp sẽ được chụp lại khi đó. Mã hiện tại đã theo luật Grammar 0.50 (nút một cỡ 40px, Tabs filter cho bộ lọc, isLoading từ SlotView).
Luật: Grammar 0.50, một nút chính mỗi màn, nút một cỡ 40px, bộ lọc một danh sách là Tabs kind="filter" (quyết định điều phối 20/11), ảnh chụp chỉ dùng dữ liệu thật.
Grammar: `Section kind="list"` + `Tabs kind="filter"`, `Stepper`, `Button`, `Popover`
