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
