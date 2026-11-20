# Source  (gallery: essentials/lesson-source, route /essentials/[topic]/[lesson]?part=source)
Mục tiêu: đưa source của bài về máy, chạy lên, hiểu kiến trúc và biết từng luật nằm ở đoạn code nào.
Thao tác: lesson(id).essential: source (langs, ref), architecture (diagram, components có luật nó giữ), codeWalk (file, line, snippet, invariant, why), invariants; lesson.workspace (runtime, commands windows/unix, files); REST GET /api/lessons/:id/workspace/:language/download cho tệp nén; relayDevices cho máy trực tuyến; relayManifest khi CLI kéo source. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/21-essentials-lesson-source.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: essentials/lesson-source (Source, đã pull; 1440 và 390); essentials/lesson-source-no-device (Source, chưa thấy máy nào kết nối; chỉ 390); essentials/lesson-source-up-command-error (Source, lệnh up lỗi; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: Tabs, Terminal, Code, DataTable, Badge, MermaidDiagram, CopyField, Alert. cần Grammar: MermaidDiagram chuyển bố cục dọc ở 390.
Hành động chính: "Tải source" (tệp nén) là cách thay cho lệnh CLI.
Lọc: không có.
Việc đổi: source là một repo chạy được, không phải đoạn code dán trong bài.
Xung đột: source.langs có thể nhiều ngôn ngữ; bản vẽ hiện một (TypeScript + Express) và cần chọn ngôn ngữ khi có hơn một.
