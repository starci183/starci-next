---
title: Dự án / Bằng chứng của concept
route: /projects/[projectId]/[milestoneId]/[conceptId]
area: projects
reviewed: 2026-11-17
---

Route: `/projects/<projectId>/<milestoneId>/<conceptId>`, dành cho người đăng ký Premium. Một concept: các ô bằng chứng, kết quả probe trên deploy thật, thang chấm của AI đọc code, lần CI ký và bản xem trước dòng CV. Ở 1440 và 1920 phần giữa chia hai cột (probe và CI bên trái, AI đọc code và thang chấm bên phải); ở 390 xếp một cột. Mã: `fe/apps/app/src/components/blocks/ProjectConcept/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.
Thang chấm đọc từ `projectCodeRead`, dòng CV xem trước từ `projectCvPreview`; chưa có lần đọc code thì mục thang chấm nói gửi đoạn code.

## Dải đầu trang (đường dẫn bốn cấp, tên concept, trạng thái)

Vì sao: Dự án / dự án / milestone / concept; trạng thái "Chưa bắt đầu" cạnh tên; dòng 12 muted "Bằng chứng: test · e2e · probe" liệt kê loại bằng chứng concept cần.
Luật: `theme-and-type.md`, `verified-experience.md`.
Grammar: `Page header={{ breadcrumbs, title, meta, status }}`.

## Ô bằng chứng

Vì sao: một hàng nhãn của các ô (test, e2e, probe) và dòng "Học ở: ..." dẫn về bài Bản chất để học lại; nếu lần chấm gần nhất bị từ chối thì thêm một cảnh báo nói lý do (không hiện trong ảnh này).
Luật: `verified-experience.md`.
Grammar: `Section`, `Badge tone`, `Alert tone="negative"`, `Link variant="plain"`.

## Probe trên địa chỉ deploy

Vì sao: chưa có địa chỉ deploy thì mục nói bảo lưu địa chỉ ở trang dự án trước, và nút "Chạy probe" mờ; có địa chỉ thì nhật ký kiểu terminal của lần probe gần nhất. Server chỉ gọi http hoặc https công khai.
Luật: `projects.md` (probe do server chạy là bằng chứng), `learner-cli-relay.md`.
Grammar: `Terminal label lines`, `Button intent="neutral" isPending`.

## CI GitHub

Vì sao: danh sách mô tả của lần chạy CI có chữ ký mới nhất; chưa có thì nói đẩy code lên GitHub để Action gửi kết quả.
Luật: `projects.md`, `verified-experience.md` (chỉ CI GitHub ký OIDC mới tính).
Grammar: `DescriptionList density="compact" isDivided`, `Badge tone`.

## AI đọc code

Vì sao: tiêu đề phụ "Chỉ code và endpoint cho concept này" và ba ô: Vị trí code (đường dẫn hoặc đường dẫn#hàm), Endpoint cho probe (ví dụ POST /bookings), Body JSON mẫu; nút "Lưu". Đoạn chứa giá trị giống bí mật bị từ chối trước khi gửi.
Luật: `projects.md` (server không clone repo, chỉ đọc đoạn học viên dán), `premium.md`.
Grammar: `Input`, `Button intent="neutral" isPending`, `Alert tone="negative"`.

## Thang chấm của AI

Vì sao: bảng từng tiêu đề với Đạt, Một phần hoặc Chưa đạt; chưa có lần chấm thì nói "Chưa có thang chấm. Gửi đoạn code để AI đọc và chấm."
Luật: `projects.md`, `verified-experience.md`.
Grammar: `Section title`, `DataTable surface="none" phone="table"`, `Badge tone`.

## Dòng CV khi đủ bằng chứng

Vì sao: bản xem trước dòng CV concept sẽ sinh ra: nhãn "Bản xem trước" (thành "Đã xác minh" khi đã chứng minh), câu CV do back end sinh, dòng "Bằng chứng:" và nút "Hỏi Claude qua MCP về concept này". Dòng 12 muted dưới cùng nói không có số tự khai.
Luật: `verified-experience.md`, `learner-cli-relay.md` (hỏi AI qua MCP).
Grammar: `Section caption`, `Badge tone`, `Button intent="neutral" href`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, 1920, 390, "Dòng CV": dòng "Bằng chứng:" kết thúc rỗng, không có nội dung sau dấu hai chấm; nhãn "Bản xem trước" là chữ xám nhỏ sát lề, không phải chip.
- 1440, 1920, 390, "AI đọc code": ba ô nhập và nút "Lưu" nhưng không thấy ô dán đoạn code hay ô giải thích 2 đến 3 câu nên không có cách gửi để AI chấm, trong khi mục bên dưới bảo "Gửi đoạn code".
- 1440, 1920, 390, ba ô nhập trống không có placeholder, hiện như hộp trắng trống không gợi ý.
- 1440, 1920, 390, "Ô bằng chứng": test, e2e, probe là chữ xám rời, không có tông trạng thái nên không biết ô nào đạt, lỗi hay chưa có; trạng thái "Chưa bắt đầu" ở đầu trang cũng là chữ xám không phải chip.
- 1440, 1920, 390, nút "Chạy probe" mờ gần như không thấy, tương phản rất thấp.
- 1440 và 1920, "Thang chấm của AI": vùng thân trống cao khoảng 150px với dòng chữ canh giữa, khác với các mục khác canh trái; khoảng trắng quanh nó lớn.
- 1440 và 1920, hai cột lệch nhau: cột trái chỉ có "Probe" và "CI GitHub" rồi bỏ trống tới hết trang trong khi cột phải kéo dài.
- 1920, dải đầu trang canh trái ở x=288, còn nội dung thu hẹp ở giữa từ x=480: mép trái lệch 192px.
- 390, đường dẫn bốn cấp bị cắt cụt ở cấp cuối ("Vòng đời re") và không có dấu ba chấm; tên concept hiện không đầy đủ.
- 1440 và 1920, mô tả muted ("Chưa có địa chỉ deploy...", "Chưa có run CI...") mang sắc nâu, tương phản thấp.
- Lần chụp lại 2026-11-17 trên dev: dòng CV hiện 'Dòng CV hiện khi concept đủ bằng chứng.' không còn dấu `**` thô nào và không còn dòng 'Bằng chứng:' rỗng; mục đầu của Phản biện này (dòng 'Bằng chứng:' rỗng, nhãn 'Bản xem trước') không còn thấy, các mục khác vẫn đúng.
- 1440 và 390, ba ô bằng chứng test, e2e, probe vẫn là chữ xám rời, chưa có chip tông cho trạng thái code đọc, probe, CI nên chưa thấy ba trạng thái khác nhau; mới chỉ thấy 'Chưa bắt đầu' vì dự án mới chưa có run nào.
