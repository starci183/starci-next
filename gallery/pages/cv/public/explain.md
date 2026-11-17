---
title: CV công khai
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (không cần đăng nhập). Chưa có bản vẽ: trang này ghép tối thiểu từ Grammar. Mã: `fe/apps/app/src/components/blocks/PublicCv/`.

## Chủ CV

Vì sao: người tuyển dụng thấy tên và ảnh của học viên, kèm dòng "CV đã xác minh bởi StarCi".
Luật: `verified-experience.md` (chỉ mục Đã xác minh vào CV).
Grammar: `Avatar`, `Text`.

## Dòng CV đã ký

Vì sao: chỉ các dòng thầy đã ký, mỗi dòng có nguồn, ngày ký và liên kết xác minh `/verify/{mã}`. Không có điểm số hay tên người duyệt. Liên kết sai hoặc CV để riêng tư đều hiện "Không có CV ở địa chỉ này".
Luật: `verified-experience.md` điều 7 (trang công khai không lộ tên người duyệt).
Grammar: `Section kind="list"` + `ListRow`, `EmptyNotice`.
