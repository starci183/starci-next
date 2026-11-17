---
title: Dự án / Bằng chứng của concept
route: /projects/[projectId]/[milestoneId]/[conceptId]
area: projects
reviewed: 2026-11-17
---

Route: `/projects/<projectId>/<milestoneId>/<conceptId>`, dành cho người đăng ký Premium. Một concept: các ô bằng chứng, kết quả probe trên deploy thật, thang chấm của AI đọc code, lần CI ký và bản xem trước dòng CV. Mã: `fe/apps/app/src/components/blocks/ProjectConcept/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.
Thang chấm đọc từ `projectCodeRead`, dòng CV xem trước từ `projectCvPreview` (back end projects-be); chưa có lần đọc code thì mục thang chấm nói gửi đoạn code.

## Dải đầu trang (đường dẫn bốn cấp, tên concept, chip trạng thái)

Vì sao: Dự án / dự án / milestone / concept; dòng phụ liệt kê loại bằng chứng concept cần; chip Đang luyện hoặc Đã chứng minh.
Luật: `theme-and-type.md`, `verified-experience.md`.
Grammar: `Page header={{ breadcrumbs, title, meta, status }}`.

## Ô bằng chứng

Vì sao: hàng chip của các ô (test, e2e, probe, AI đọc code) với trạng thái; nếu lần chấm gần nhất bị từ chối thì một cảnh báo nói lý do bằng lời, câu hỏi của thầy AI, và liên kết về bài Bản chất để học lại.
Luật: `verified-experience.md`.
Grammar: `Section`, `Badge tone`, `Alert tone="negative"`, `Link variant="plain"`.

## Probe trên địa chỉ deploy

Vì sao: nhật ký kiểu terminal của lần probe gần nhất cho concept này (`✓` hoặc `✗` từng probe và lý do), ghi địa chỉ đã gọi ở đầu mục; chưa có địa chỉ thì bảo lưu địa chỉ ở trang dự án; nút "Chạy probe" chạy lại. Server chỉ gọi http hoặc https công khai.
Luật: `projects.md` (probe do server chạy là bằng chứng), `learner-cli-relay.md`.
Grammar: `Terminal label lines`, `Button intent="neutral" isPending`.

## CI GitHub

Vì sao: danh sách mô tả gọn của lần chạy CI có chữ ký mới nhất của dự án: run, commit (mono), kết quả, lúc nào. Chưa có thì nói đẩy code lên GitHub.
Luật: `projects.md`, `verified-experience.md` (chỉ CI GitHub ký OIDC mới tính).
Grammar: `DescriptionList density="compact" isDivided`, `Badge tone`.

## AI đọc code và thang chấm

Vì sao: học viên chỉ vị trí code và endpoint cho probe, rồi dán đoạn xử lý cùng 2 đến 3 câu giải thích; AI chấm theo tiêu chí và bảng thang chấm hiện từng tiêu chí với Đạt (met), Một phần (partial) hay Chưa đạt (missing). Đoạn chứa giá trị giống bí mật bị từ chối trước khi gửi; lỗi của lệnh hiện ngay dưới biểu mẫu.
Luật: `projects.md` (server không clone repo, chỉ đọc đoạn học viên dán), `premium.md` (AI đọc code thuộc Premium).
Grammar: `Input`, `Textarea rows`, `Button intent="neutral" isPending`, `DataTable surface="none" phone="table"`, `Badge tone`, `Alert tone="negative"`.

## Dòng CV khi đủ bằng chứng

Vì sao: bản xem trước dòng CV concept sẽ sinh ra: nhãn "Đã xác minh" (hoặc "Bản xem trước" khi concept chưa chứng minh), câu CV do back end sinh, dòng muted nêu bằng chứng (CI run, ngày probe, số concept). Dưới đó nói không có số tự khai, và nút "Hỏi Claude qua MCP về concept này" dẫn tới trang kết nối.
Luật: `verified-experience.md`, `learner-cli-relay.md` (hỏi AI qua MCP).
Grammar: `Section caption`, `Badge tone="success"`, `Button intent="neutral" href`.
