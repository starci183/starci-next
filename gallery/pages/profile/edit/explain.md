---
title: Sửa hồ sơ
route: /profile/edit
area: profile
---

Route: `/profile/edit` (trang con "Hồ sơ / Sửa"). Mã: `fe/apps/app/src/components/blocks/ProfileEdit/`. Giải thích đầy đủ nằm ở `profile/overview`, mục "Sửa hồ sơ". Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Đầu trang: Hủy và Lưu thay đổi

Vì sao: Hủy là nút trung tính, "Lưu thay đổi" là nút chính duy nhất và tắt khi ảnh đang tải lên; lưu xong quay về Hồ sơ.
Luật: `conventions.md` (một nút chính mỗi trang).
Grammar: `Page header breadcrumbs actions`, `Button`.

## Ảnh đại diện

Vì sao: chọn ảnh (kiểm loại và dung lượng ở trình duyệt, giới hạn lấy từ máy chủ), gửi thẳng tới kho và tự lưu; xóa ảnh có xác nhận vì ảnh bị xóa khỏi kho.
Luật: `conventions.md` (giới hạn lấy từ máy chủ, không viết cứng).
Grammar: `Avatar`, `FileButton`, `AlertDialog`.

## Tên hiển thị và liên kết CV

Vì sao: ô nhập tên có số ký tự trên giới hạn; liên kết CV với công tắc công khai để đặt ngay lúc sửa.
Luật: `verified-experience.md` (trang công khai không lộ điểm số hay tên người duyệt).
Grammar: `Input`, `CopyField`, `Switch`.
