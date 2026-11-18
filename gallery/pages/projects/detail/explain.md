---
title: Dự án / Chi tiết
route: /projects/[projectId]
area: projects
reviewed: 2026-11-17
---

Route: `/projects/<projectId>`, dành cho người đăng ký Premium. Trang dự án có hai pane ở 1440: milestone, lần chạy, kinh nghiệm và địa chỉ deploy ở pane giữa; kho mã, chứng thực CI, máy của bạn, bí mật CI và thư mục starci/ ở aside bên phải. Ở 390 aside đứng trước pane giữa. Trang dùng các composite của starci-next-ui. Mã: `fe/apps/app/src/components/blocks/ProjectDetail/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (đường dẫn, tên, chip trạng thái, dòng repo, "Cập nhật kết quả từ máy")

Vì sao: đường dẫn về danh sách; tên dự án kèm chip trạng thái cả dự án ("Chưa bắt đầu", tính từ số concept); dòng 12 muted nêu repo và stack (NestJS, Next.js, TypeScript); một lệnh duy nhất "Cập nhật kết quả từ máy" bên phải.
Luật: `theme-and-type.md`, `verified-experience.md`.
Grammar: `Page header={{ title, breadcrumbs, meta, status, actions }}`, `Badge isDot`, `Button intent="neutral"`.

## Milestone (pane giữa)

Vì sao: một Section "Milestone" với chip đếm 11, mỗi milestone là một hàng: ô biểu tượng thư mục, tên, "0/3 concept đã chứng minh", trạng thái chữ "Chưa bắt đầu" và thanh tiến độ; hàng dẫn tới bảng concept của milestone.
Luật: `verified-experience.md`, `projects.md`.
Grammar: composite `MilestonesCard` của starci-next-ui.

## Lần chạy gần đây

Vì sao: bảng các lần chạy (cột Loại, Chi tiết, Kết quả, Lúc); chưa có lần chạy nào thì thân bảng nói "Chưa có lần chạy nào." Lần chạy do CI ký hoặc server probe.
Luật: `verified-experience.md`.
Grammar: composite `RunsCard`.

## Kinh nghiệm từ dự án

Vì sao: ba hàng đếm: concept đã chứng minh, concept đang luyện, milestone xong (đều 0), cùng liên kết "Xem kinh nghiệm →" ở đầu mục; chỉ concept đã chứng minh mới thành kinh nghiệm.
Luật: `verified-experience.md`, `surface-layering.md` (liên kết trong đầu mục kết thúc bằng mũi tên).
Grammar: composite `ExperienceCard`.

## Địa chỉ đã triển khai

Vì sao: một mô tả (ứng dụng HTTP chạy được bằng Docker, StarCi gọi địa chỉ công khai với health và probe chung), ô địa chỉ http hoặc https công khai, nút "Lưu địa chỉ" và nút "Chạy kiểm tra" (mờ khi chưa có địa chỉ đã lưu).
Luật: `projects.md` (probe chạy trên địa chỉ công khai).
Grammar: composite `DeployCard`.

## Aside: kho mã, chứng thực CI, máy của bạn, bí mật CI, thư mục starci/

Vì sao: những thứ cấu hình dự án, ngăn bằng đường kẻ: liên kết repo, "Chứng thực CI" kèm chip "Chưa có chữ ký" và lời giải thích, khối thiết bị kèm nút "Kết nối máy", "Bí mật CI" với nút "Đổi bí mật CI", cây thư mục starci/ và ghi chú test unit và integration.
Luật: `learner-cli-relay.md`, `surface-layering.md`.
Grammar: composite `ProjectAside` (starci-next-ui) trên `Badge isDot`, `Input isCopyable`, `Divider`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, dải đầu trang: nút "Cập nhật kết quả từ máy" kết thúc ở x=1428, cách mép phải 12px, trong khi các trang khác chừa lề 32px; nút sát mép hơn lề nội dung.
- 1440, lề trái trang là 268 (đường dẫn, tiêu đề, danh sách) còn các trang Dự án khác là 288: không cùng lề với `projects/list`.
- 1440, "Lần chạy gần đây": bảng rỗng được bao trong một thẻ bo góc có viền, thân trống cao khoảng 120px; luật là bảng phẳng trên nền trang, không thẻ.
- 1440, "Địa chỉ đã triển khai": cả biểu mẫu được bao trong thẻ viền bo lớn; biểu mẫu không phải vật thật nên không cần thẻ.
- 1440, "Địa chỉ đã triển khai": ô nhập địa chỉ trống không placeholder; nút "Chạy kiểm tra" mờ gần như không thấy.
- 1440, "Milestone": thanh tiến độ 0 của mỗi hàng là vạch xám rất nhạt gần như vô hình; trạng thái "Chưa bắt đầu" là chữ xám 12 nằm lệch dòng so với tên và dòng tiến độ.
- 1440, "Milestone": mỗi hàng có ô biểu tượng thư mục nền xám (icon tile), 11 hàng giống hệt nhau, không mang thông tin.
- 1440, aside, thư mục starci/: các dòng `starci/`, `project.yaml start · health · test`, `e2e/`, `[concept].md` cách nhau như đoạn rời chứ không thành cây có thụt lề; tiêu đề "Test unit và integration" ngay sát dòng cuối của cây.
- 1440, aside: "Kho mã" là liên kết nhưng hiện chữ đen đậm như nhãn; chữ giải thích muted có sắc nâu, tương phản thấp.
- 1440, aside hẹp làm các đoạn giải thích xuống 3 đến 4 dòng; khối "Thư mục starci/" kéo dài hơn pane trái.
- 390, aside đứng trước danh sách Milestone nên nội dung chính bị đẩy xuống sau 5 khối cấu hình; thanh tiến độ của mỗi milestone nằm dưới hàng và canh trái lệch với tên.
- 390, nút "Cập nhật kết quả từ máy" nằm dưới dòng repo; chip trạng thái "Chưa bắt đầu" nhỏ và sát tên.
- Lần chụp lại 2026-11-17 trên dev: dự án tạo mới hiện đủ 3 milestone (Nền tảng HTTP 0/4, Dữ liệu và cache 0/2, An toàn và tin cậy 0/4) tức 10 check; các điều trên vẫn đúng ở 1440 và 390.
- 1440 và 390, 'Kho mã' chỉ hiện 'Chưa gắn repo' và không có ô nối repo sau khi tạo; repo chỉ nhập được ở màn Tạo dự án, nên dự án tạo không có repo không thể nối chứng thực CI từ trang này.
- Danh sách dự án hiện '0/9' còn trang dự án cộng 4+2+4 = 10 concept: concept unit-testing-behavior cần AI đọc code mà chưa có bài Bản chất sống nên bị loại khỏi mẫu số ở danh sách nhưng vẫn hiện ở trang milestone.
