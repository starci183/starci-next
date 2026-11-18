---
title: Bài Essentials · phần 2 Source
route: /essentials/[topic]/[lesson]?part=source
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=source`. Mục tiêu: đưa source của bài về máy, chạy lên, hiểu kiến trúc và biết từng luật nằm ở đoạn code nào. Dữ liệu: lesson(id).essential (source, architecture, codeWalk, invariants), lesson.workspaces, tải nén qua REST GET /api/lessons/:id/workspace/:language/download, relayDevices cho máy trực tuyến. Nút chính: Tải source (.tgz). Không cần API mới.

## Lấy source về máy

Vì sao: dòng máy trực tuyến, một dòng mô tả Terminal trên máy bạn, nút Sao chép và một Terminal tối ghi hai lệnh `npx @starci/next pull <bài>` rồi `starci-next up`; lệnh chạy ở máy học viên, trang không chạy gì.
Luật: `ui/components/data-views.md` (Terminal là nhật ký), `theme-and-type`.
Grammar: `Cluster`, `Button size="sm"`, `Terminal` (`branch/Terminal`). Code: `EssentialSource/index.tsx`.

## Dòng máy

Vì sao: một chip chấm xanh ghi tên máy trực tuyến lấy từ relayDevices; khi không có máy nào, một thông báo vàng nói thẳng chưa thấy máy, bảo chạy lệnh đăng nhập một lần và trang tự nhận khi CLI báo về.
Luật: `ui/components/toast-alert.md` (Alert nói trạng thái, không thẻ trong thẻ), `theme-and-type` (tông vàng là cảnh báo).
Grammar: `Badge isDot tone="success"`, `Alert tone="cautionary"` (`composite/Alert`). Code: `EssentialSource/index.tsx` `MachineLine`, `EssentialScenarios/Detail.tsx`.

## Kiến trúc

Vì sao: sơ đồ mermaid của bài, nhãn luật (C2, C3, C4) trên đường nối; chạy theo chiều tác giả vẽ.
Luật: `ui/components/diagram.md`.
Grammar: `MermaidDiagram` (`frame/MermaidDiagram`). Khoảng trống: không có `narrowDirection` để chuyển dọc ở 390 (GRAMMAR-GAPS #5).

## Mỗi thành phần giữ luật nào

Vì sao: bảng phẳng ba cột Thành phần, Cổng, Luật nó giữ, không khung.
Luật: `ui/components/list-table.md` (bảng phẳng trong Section).
Grammar: `Section` + `DataTable`. Code: `EssentialSource/index.tsx`.

## Đọc code · luật nằm ở đâu

Vì sao: mỗi đoạn là một Section: tên đoạn, `file:dòng` ở đầu, chip luật, đoạn code đúng như trong repo và câu Vì sao.
Luật: `ui/components/card.md` (không thẻ trong thẻ).
Grammar: `Section fact`, `Badge tone="accent"`, `HighlightedCode`. Code: `EssentialSource/index.tsx` `WalkEntry`.

## Cột phải (1440): Trong source, Không có trong source, Cần có

Vì sao: cây tệp của kho nén, nhắc rằng đáp án mẫu và test ẩn ở lại máy chủ, và yêu cầu máy.
Luật: `ui/composition.md` (aside là các khối cách nhau bằng đường kẻ).
Grammar: `Section`, `Text mono`. Code: `EssentialSource/Aside.tsx`.

## Nút chính

Vì sao: Tải source (.tgz) là cách thay cho lệnh CLI, đặt ở đầu bài; không có nút thứ hai.
Luật: `ui/components/button.md` (một nút chính mỗi vùng).
Grammar: `Button intent="commit" href` (`leaf/Button`). Code: `EssentialSourceDownload`.

## Phản biện

Vì sao: tự phản biện của lần chụp này trên stand-in core (dữ liệu mẫu của bản vẽ); liệt kê điều còn lệch với khung đã duyệt.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Khung đầu bài và thanh bên là của lane khác nên không so ở đây.
- Sơ đồ ở 390 vẫn ngang (thiếu `narrowDirection` của Grammar), nên nhãn bị nén so với khung dọc đã duyệt.
- Terminal không có nút sao chép riêng, nên nút Sao chép là một Button đứng cạnh dòng mô tả.
- Cây tệp là danh sách đường dẫn phẳng (chưa thụt theo thư mục) vì dữ liệu chỉ có đường dẫn.
