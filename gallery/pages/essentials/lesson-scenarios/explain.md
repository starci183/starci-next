---
title: Bài Essentials · phần 3 Kịch bản
route: /essentials/[topic]/[lesson]?part=scenarios
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=scenarios`. Mục tiêu: chạy từng kịch bản lỗi trên máy mình, thấy đỏ, hiểu vì sao, nhờ AI sửa rồi check lại tới khi xanh. Dữ liệu: lesson(id).essential.scenarios, lessonScenarioRuns (đọc lại mỗi 2 giây khi một lần chạy còn đang chạy), requestLessonRun (nút Chạy kịch bản), revealLessonHint (gợi ý khóa tới lần đỏ đầu), relayDevices. Nút chính theo trạng thái: Chạy kịch bản, Check lại, Kịch bản tiếp theo; xám kèm lý do khi không có máy trực tuyến.

## Danh sách kịch bản

Vì sao: cột trái (1440) là danh sách phẳng năm kịch bản, mỗi hàng id, một dòng lỗi và nhãn trạng thái (Xanh, Đỏ, Chưa chạy), đếm xanh ở đầu, một dòng quy trình ở cuối; ở 390 danh sách lên trước chi tiết.
Luật: `ui/components/list-table.md`.
Grammar: `PrimaryRailLayout railPosition="leading" collapsedOrder="rail-first"`, `Section kind="list"`, `ListRow badges onPress`. Code: `EssentialScenarios/index.tsx`. Khoảng trống: hàng đang chọn chưa có nền xám (ListRow không có tint).

## Dòng máy

Vì sao: một chip chấm xanh ghi tên máy trực tuyến lấy từ relayDevices; khi không có máy nào, một thông báo vàng nói thẳng chưa thấy máy, bảo chạy lệnh đăng nhập một lần và trang tự nhận khi CLI báo về.
Luật: `ui/components/toast-alert.md` (Alert nói trạng thái, không thẻ trong thẻ), `theme-and-type` (tông vàng là cảnh báo).
Grammar: `Badge isDot tone="success"`, `Alert tone="cautionary"` (`composite/Alert`). Code: `EssentialSource/index.tsx` `MachineLine`, `EssentialScenarios/Detail.tsx`.

## Kết quả chạy

Vì sao: Terminal tối: dòng lệnh rồi các dòng kết quả relay gửi về (✓ ✗); trong lúc chạy Terminal ở trạng thái đang tải.
Luật: `ui/loading.md`.
Grammar: `Terminal isLoading`. Code: `EssentialScenarios/Detail.tsx`.

## Vì sao sai / Luật đã giữ

Vì sao: khối đỏ nêu thông điệp của lần chạy và luật bị phá (id, lời); khi xanh là khối xanh nêu luật đã giữ.
Luật: `ui/components/toast-alert.md`.
Grammar: `Alert tone="negative"` / `"affirmative"`.

## Gợi ý

Vì sao: khóa tới lần chạy đỏ đầu tiên (server giữ nội dung); mở thì ghi chú dùng gợi ý thì bài ghi có hỗ trợ; có nút Xem gợi ý khi đã chạy mà chưa đỏ (revealLessonHint).
Luật: `premium` (server từ chối, UI không giấu), `essentials` luật 3.
Grammar: `Alert tone="neutral" action`.

## Sửa

Vì sao: một đoạn nói học viên không gõ code, lời nhắc sao chép cho AI của họ (có nút Sao chép lời nhắc) và công tắc --guard tắt một luật để thấy hệ thống vỡ.
Luật: `essentials` (học viên chỉ đạo AI).
Grammar: `Section`, `FencedCodeBlock action`, `Switch`. Code: `EssentialScenarios/Detail.tsx` `Fix`.

## Bí? Hỏi Claude

Vì sao: app không chứa khung chat: khung này nói Claude của học viên đọc lần chạy và code qua connector StarCi (my_runs, read_file) và dẫn tới trang nối connector. Đây là khoảng trống so với bản vẽ (cuộc trò chuyện có dòng gọi tool).
Luật: `mcp` concept (AI của học viên, không phải của app).
Grammar: `Section fact`, `Link`. Khoảng trống Grammar: `ToolCallLine` (GRAMMAR-GAPS #4).

## Nút chính

Vì sao: theo trạng thái: Chạy kịch bản (requestLessonRun), Check lại khi đỏ, Kịch bản tiếp theo khi xanh; xám kèm lý do khi không có máy trực tuyến.
Luật: `ui/components/button.md`.
Grammar: `Button intent="commit" isDisabled isPending`. Code: `parts/PrimaryAction.tsx`.

## Phản biện

Vì sao: tự phản biện của lần chụp này trên stand-in core (dữ liệu mẫu của bản vẽ); liệt kê điều còn lệch với khung đã duyệt.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Hàng kịch bản đang chọn không có nền xám như bản vẽ (ListRow chưa có tint).
- Không có cuộc trò chuyện Claude trong trang: chỉ lời nhắc và liên kết tới connector.
- Tên kịch bản không in đậm mono như bản vẽ (Grammar không có biến thể).
