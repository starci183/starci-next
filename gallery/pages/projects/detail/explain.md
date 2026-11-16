---
title: Dự án / Chi tiết
route: /projects/[projectId]
area: projects
---

Route: `/projects/<projectId>`, dành cho người đăng ký Premium. Trang dự án: milestone, lần chạy gần đây, kinh nghiệm và địa chỉ deploy ở pane giữa; kho mã, chứng thực CI, máy của bạn, bí mật CI và thư mục starci/ ở aside. Trang này dùng các composite của starci-next-ui đã chuyển sang Section và DataTable ở lane theme (Grammar 0.40.1); lane projects-fe giữ cấu trúc hai pane và chỉ thêm cổng Premium. Mã: `fe/apps/app/src/components/blocks/ProjectDetail/`.
CHƯA RÕ: bước kế của lane là đưa trang này thành các Section phẳng như danh sách và milestone; ảnh chụp cũ có thể còn thẻ.

## Dải đầu trang (đường dẫn, tên, chip trạng thái, dòng repo, "Cập nhật kết quả từ máy")

Vì sao: đường dẫn về danh sách; chip trạng thái cả dự án tính từ số concept; một lệnh duy nhất cập nhật kết quả từ máy.
Luật: `theme-and-type.md`, `verified-experience.md`.
Grammar: `Page header={{ title, breadcrumbs, meta, status, actions }}`, `Badge isDot`, `Button intent="neutral"`.

## Milestone, lần chạy, probe, kinh nghiệm, địa chỉ deploy (pane giữa)

Vì sao: mỗi milestone là một hàng có thanh tiến độ dẫn tới bảng concept; lần chạy gần đây (CI ký, server probe) là bảng; kết quả từng probe chỉ hiện khi có; kinh nghiệm chỉ đếm concept đã chứng minh; địa chỉ deploy có lưu và chạy kiểm tra.
Luật: `verified-experience.md`, `projects.md`.
Grammar: các composite `MilestonesCard`, `RunsCard`, `ProbesCard`, `ExperienceCard`, `DeployCard` của starci-next-ui.

## Aside: kho mã, chứng thực CI, máy của bạn, bí mật CI, thư mục starci/

Vì sao: những thứ cấu hình dự án, ngăn bằng đường kẻ: liên kết repo, chip có chữ ký hoặc chưa, nút kết nối máy, đổi bí mật CI (hiện bí mật mới một lần), cây thư mục starci/.
Luật: `learner-cli-relay.md`, `surface-layering.md`.
Grammar: composite `ProjectAside` (starci-next-ui) trên `Badge isDot`, `Input isCopyable`, `Divider`.
