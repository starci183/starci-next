---
title: CV công khai
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (không cần đăng nhập). Chưa có bản vẽ: trang này ghép tối thiểu từ Grammar. Mã: `fe/apps/app/src/components/blocks/PublicCv/`.

Vì sao: người tuyển dụng mở liên kết CV tổng hợp của học viên và chỉ thấy tên, ảnh và các dòng đã được thầy ký, mỗi dòng có nguồn, ngày ký và liên kết xác minh `/verify/{mã}`. Không có điểm số hay tên người duyệt. Liên kết sai hoặc CV để riêng tư đều hiện "Không có CV ở địa chỉ này".
Grammar: `Avatar`, `Section kind="list"` + `ListRow`, `EmptyNotice`.
