---
title: CV công khai, ít dòng
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (ảnh chụp: một dòng đã ký). Mã: `fe/apps/app/src/components/blocks/PublicCv/`. Màn đủ nằm ở `cv/public`.

## Chủ CV

Vì sao: như `cv/public`; dòng sự kiện nói "1 dòng đã ký".
Luật: `verified-experience.md` điều 7.
Grammar: `Avatar`, `Heading`, `Text`, `Button`.

## Dòng CV đã ký

Vì sao: một dòng vẫn đủ vết tin cậy và liên kết xác minh. Dưới danh sách một dòng chữ xám nói CV tự cập nhật khi thầy ký thêm; không đếm hay nói số dòng còn chờ. Không có chip nguồn dưới 8 dòng. Khi CV công khai mà chưa có dòng nào, danh sách nói "Chưa có dòng CV nào để hiện." và phần còn lại như đây.
Luật: `verified-experience.md` điều 4 (dòng chờ không bao giờ công khai).
Grammar: `Section kind="list"` + `ListRow`, `Text`.

## Vì sao tin được CV này

Vì sao: cột giải thích giữ nguyên để trang không trông trống.
Luật: `verified-experience.md` điều 3 và 7.
Grammar: `Section`, `Stepper`.
