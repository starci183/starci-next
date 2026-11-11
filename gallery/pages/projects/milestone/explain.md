---
title: Dự án / Milestone
route: /projects/[projectId]/[milestoneId]
area: projects
---
Route: `/projects/<projectId>/<milestoneId>` (ảnh chụp: dự án "Shop bán sách", milestone "Nền tảng HTTP", chưa có lần chạy nào). Grammar ở `node_modules/@starci/grammar/dist/core/`. Mã: `fe/apps/app/src/components/blocks/ProjectMilestone/` (`component.tsx` vẽ trang, `drawer.tsx` ngăn kéo chỉ code, `view.ts` đổi dữ liệu ra chữ).

## Băng đầu trang (đường dẫn Dự án / dự án / milestone, tiêu đề, chip trạng thái, dòng phụ)
Vì sao: băng trắng, sát trái; đường dẫn Dự án / Shop bán sách / Nền tảng HTTP để quay về từng cấp; tiêu đề 18/600 là tên milestone, chip "Đang làm" (cam) hoặc "Đã xong" (xanh) ngay cạnh; dòng phụ 12 muted "0/3 concept đã chứng minh". Không có nút lệnh: việc chỉ code nằm trong từng hàng concept.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page chrome="panes" header={{ breadcrumbs, title, meta, status }}` (`frame/Page/index.d.ts`, `composite/PageHeader`), `Badge tone`.

## Nhãn "Concept của milestone" + chip đếm
Vì sao: nhãn khối nằm trên thẻ, chip đếm xám (3 concept); không có mô tả dưới nhãn.
Luật: `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard kind="list" label count` (`frame/SurfaceCard/index.d.ts`, `CardHead`).

## Thẻ danh sách concept
Vì sao: MỘT thẻ, một nội dung (danh sách). Mỗi hàng: tên concept (500), dòng 12 muted loại bằng chứng ("Bằng chứng: test · e2e · probe" hoặc "AI đọc code"), chip trạng thái Chưa có / Đang luyện / Đã chứng minh (muted / cam / xanh), liên kết "Bài Bản chất" sang bài học của concept (liên kết nội bộ nên từ Grammar 0.37.14 không có ↗, màu chính), mũi tên chevron vì cả hàng mở ngăn kéo nơi học viên chỉ code và nhờ thầy AI đọc code. Hai biểu mẫu cũ (chỉ code, đọc code) không còn nằm trong thẻ: một thẻ không chứa biểu mẫu lẫn danh sách.
Luật: `table-heroui-native-section-head.md` (một nội dung một thẻ), `surfacecard-select-subtitle.md` (tên hàng là danh từ), `type-scale-14-12.md`.
Grammar: `SurfaceCard kind="list"` với `ListRowData { title, description (node, 12), badges, onPress, detail }` (`surfaceCardData.d.ts`), `Link`, `Drawer` (`frame/Drawer/index.d.ts`).

## Nhãn "Lần chạy bằng chứng" + thẻ bảng
Vì sao: dữ liệu có cột nên là bảng (thẻ trắng, tiêu đề cột muted): Concept, Bằng chứng, Kết quả (chip), Mức (Đang luyện hay Đã chứng minh), Lúc (thời gian tương đối). Mỗi hàng là một khe bằng chứng đã có kết quả (test, e2e, probe, thầy đọc code). Chưa có lần chạy: trạng thái rỗng nằm TRONG thẻ, giải thích cách có kết quả đầu tiên. Cột Bằng chứng và Mức ẩn dưới 768 để bảng vừa màn hình điện thoại.
Luật: `table-heroui-native-section-head.md`, `verified-experience-per-part.md` (Đang luyện chưa tính, Đã chứng minh cần CI có chữ ký hoặc server chạy lại).
Grammar: `SurfaceCard kind="table" columns rows empty` (`TableData`, `TableColumnData.hideBelow`).

## Ngăn kéo của concept (mở từ hàng)
Vì sao: biểu mẫu "Chỉ code và endpoint" và "Nhờ thầy AI đọc code" là việc phụ, mở theo hàng; nút chính "Gửi thầy AI đọc" là nút chính duy nhất của ngăn kéo.
Luật: `verify-against-visualize.md`.
Grammar: `Drawer width="wide"` (`frame/Drawer/index.d.ts`), `Input`, `Textarea`, `Button intent`.

## Cột phụ bên phải: "Cách chứng minh" và "CI có chữ ký"
Vì sao: cột trắng, phẳng, chỉ viền; bốn bước đánh số 1 đến 4 (viết test, chạy CLI = Đang luyện, đẩy GitHub để CI ký, kết quả có chữ ký hoặc server chạy lại = Đã chứng minh); gạch ngăn; rồi "CI có chữ ký" với một câu giải thích và liên kết "Xem bí mật trong dự án →" (liên kết điều hướng nên có →). Dưới lg cột này xuống ĐẦU phần giữa.
Luật: `pink-page-surface-rule.md`, `nivo-surface-layering.md`.
Grammar: `Pane area="aside" surface scroll`, `Section kind="list"` với `leading: { position }` (`frame/Section/index.d.ts`, `PaneGrid`), `Divider`, `Link variant="head"`.
Đã rõ: Grammar 0.37.14: `Section kind="list"` trong `Pane surface` vẽ phẳng trên mặt trắng, không viền, không prop (`node_modules/@starci/grammar/dist/core/frame/Section/index.d.ts`); ảnh 1440 xác nhận: bốn bước đánh số là hàng có đường kẻ.
Đã kiểm (390, Grammar 0.37.14, chụp lại với stack chạy): aside đứng trước và hiển thị đủ đến liên kết "Xem bí mật trong dự án →", không còn bị khối giữa đè; trang cuộn một lần. SAI còn lại: nhãn khối "Concept của milestone" và "Lần chạy bằng chứng" co chiều cao về 0 (chỉ còn chip đếm, chữ bị cắt ở ranh giới aside/giếng).
SAI (390): nhãn "Concept của milestone" và "Lần chạy bằng chứng" co chiều cao về 0 (chỉ còn chip đếm); xem Grammar needs.
