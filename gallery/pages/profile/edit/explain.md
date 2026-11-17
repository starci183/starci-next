---
title: Sửa hồ sơ
route: /profile/edit
area: profile
---

Route: `/profile/edit` (trang con "Hồ sơ / Sửa"). Mã: `fe/apps/app/src/components/blocks/ProfileEdit/`. Giải thích đầy đủ nằm ở `profile/overview`, mục "Sửa hồ sơ".

- Ảnh đại diện: chọn ảnh (kiểm loại và dung lượng ở trình duyệt, giới hạn lấy từ máy chủ), gửi thẳng tới kho, xóa ảnh có xác nhận.
- Tên hiển thị: ô nhập có số ký tự trên giới hạn.
- Liên kết CV: hộp liên kết và công tắc công khai.
- Hủy là nút trung tính, "Lưu thay đổi" là nút chính duy nhất, tắt khi ảnh đang tải lên.

Grammar: `Page header breadcrumbs actions`, `FileButton`, `Input`, `CopyField`, `Switch`, `AlertDialog`.
