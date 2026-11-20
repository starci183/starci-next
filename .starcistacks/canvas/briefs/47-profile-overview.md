# Hồ sơ  (gallery: profile/overview, route /profile)
Mục tiêu: thấy mình hiện ra thế nào với người khác, đổi ảnh và tên, lấy liên kết CV; từ đây vào Kinh nghiệm và Tiến độ.
Thao tác: myProfile (displayName, avatarUrl, goal, limits: contentTypes, maxBytes, nameMax), setProfileName, requestAvatarUpload rồi trình duyệt gửi thẳng tới kho đối tượng và confirmAvatarUpload, removeAvatar; myExperience (dòng đã xác minh), showExperience, verifyExperience (trang /verify/{mã}). cần API: liên kết CV tổng hợp next.starci.vn/cv/{slug} (cvLink, setCvVisibility); hiện chỉ có liên kết theo từng dòng.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/47-profile-overview.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: profile/overview (Hồ sơ, xem; 1440 và 390); profile/overview-editing (Hồ sơ, sửa hồ sơ; 1440 và 390); profile/overview-photo-uploading (Hồ sơ, ảnh đang tải lên; chỉ 390); profile/overview-photo-too-large (Hồ sơ, ảnh quá nặng; chỉ 390); profile/overview-photo-changed (Hồ sơ, ảnh vừa đổi xong; chỉ 390); profile/overview-confirm-delete-photo (Hồ sơ, xóa ảnh, xác nhận; chỉ 390); profile/overview-new-learner (Hồ sơ, học viên mới; chỉ 390); profile/overview-partial-error (Hồ sơ, một vùng lỗi; chỉ 390); profile/overview-loading (Hồ sơ, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, first-visit (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Section, Avatar, ProgressCircle, FileButton, Input, Switch, CopyField, Section kind="list", ListRow, AlertDialog. cần Grammar: vòng tiến độ quanh Avatar khi đang tải ảnh (ghép ProgressCircle với Avatar).
Hành động chính: "Sửa hồ sơ"; ở trang sửa là "Lưu thay đổi" (Hủy trung tính).
Lọc: không có.
Việc đổi: Hồ sơ là cửa vào Kinh nghiệm và Tiến độ (thanh bên chỉ còn một mục Hồ sơ).
Xung đột: một vùng lỗi không làm hỏng cả trang.
