---
title: Bản chất / Bài học · phần 3 Kịch bản
route: /essentials/[topic]/[lesson]?part=scenarios
area: essentials
---

Route: `/essentials/[topic]/[lesson]?part=scenarios` (`&scenario=<id>` mở thẳng một kịch bản). Phần 3: chạy kịch bản trên máy mình bằng `starci-next`, kết quả về qua relay (task `lesson:<bài>`, check id = id kịch bản) và hiện ở đây; trang đọc lại mỗi 2 giây khi có lần chạy đang dở, 10 giây khi rảnh. Đỏ thì "Vì sao sai" và "Hỏi AI sửa"; người học chẩn đoán và chỉ đạo AI, không gõ code. Cần Premium. Code: `EssentialScenarios` trong `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`, `scenariosOf` trong `fe/apps/app/src/hooks/essentialLesson/essentialLesson.shared.ts`, SWR `useQueryLessonScenarioRunsSwr`.

## Danh sách kịch bản (trạng thái lần chạy mới nhất)

Vì sao: mỗi kịch bản một hàng: tên, lỗi nó gây ra, chip Chưa chạy / Đang chạy / Xanh / Đỏ / "Đỏ do tắt guard" (đỏ khi tắt guard là bằng chứng luyện tập, không phải lỗi); hàng đầu là kịch bản đang chọn; head "Kịch bản" có meta "0/8 kịch bản xanh" ở lề phải; mỗi hàng có chevron cuối; tám hàng, chưa hàng nào chạy.
Luật: COOK 2026-11-17 phần 3; concept `learner-cli-relay` rule 5 (tag lesson+scenario).
Grammar: `Section kind="list" meta items[{ title, description, badges, onPress, state }]` (`frame/Section/index.d.ts`, `surfaceCardData.d.ts`).

## Kịch bản đang chọn: lệnh và kết quả từ máy

Vì sao: dưới danh sách là tiêu đề kịch bản đang chọn kèm chip trạng thái ("Chưa chạy"), một câu mô tả, khối lệnh một dòng `starci-next run <bài> --scenario <id>` rồi Terminal nền tối với đề "Kết quả gửi về từ máy bạn" và dòng "Chưa có lần chạy nào. Chạy lệnh ở trên, kết quả sẽ hiện ở đây." Hộp "Vì sao sai" và "Hỏi AI sửa" chỉ hiện khi kịch bản đỏ nên không có trong ảnh.
Luật: COOK 2026-11-17 phần 3 ("command, expected output … results stream to the app via the relay"); SCENARIO-CONTRACT §5; owner pivot 2026-11-17 ("fix = ask your AI … then starci-next check judges").
Grammar: `Section fact meta` (`frame/Section/head.d.ts`), `FencedCodeBlock` (`frame/MarkdownArticle/index.d.ts`), `Terminal lines title isLoading` (`branch/Terminal/index.d.ts`), `Badge` (`leaf/Badge/index.d.ts`).

## Bài viết kịch bản: Cách làm phần này, Tám kịch bản, Khi bạn bí

Vì sao: thân markdown của thầy dưới Terminal: "1. Cách làm phần này" (lệnh chạy và lệnh tắt guard, cách lấy prompt `starci-next prompt`), "2. Tám kịch bản" (mỗi kịch bản một khối: câu mô tả, lệnh chạy, "Output phải có" với khối text, "Kết luận", rồi "Vì sao sai khi tắt guard" kèm lệnh `--guard <g>=off` và output đỏ; kịch bản cuối có bảng "Guard tắt · Dòng sổ đối soát · Ý nghĩa"), và "3. Khi bạn bí" (ba gạch đầu dòng: prompt, MCP `my_runs`/`read_file`/`request_run`, check lại). Mỗi khối code có nhãn ngôn ngữ và "Sao chép".
Luật: COOK 2026-11-17 phần 3; `surface-layering` (bảng phẳng, không thẻ); concept `learner-cli-relay`.
Grammar: `Markdown source labels renderCode` (`frame/Markdown/index.d.ts`), `FencedCodeBlock` (`frame/MarkdownArticle/index.d.ts`), `DataTable`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, bài viết "2. Tám kịch bản": cú pháp thô của markdown rò ra thành chữ: các dòng `::::accordion`, `:::panel{title="Kịch bản 1 · happy-path: ..."}`, `:::muted ... :::`, `:::` và `::::` hiện nguyên văn giữa trang; tám panel không dựng thành accordion nên tám kịch bản trải ra một mạch dài hơn 9000 px, và dòng muted bị dính thành một câu có `:::` hai đầu. Đây là lỗi nội dung hiển thị rõ nhất của trang.
- 1440, danh sách kịch bản: hàng thứ hai cắt mô tả bằng "..." ("Đối tác vẫn phải được ..."); chip "Chưa chạy" 12 muted rất nhạt cạnh chevron, tám hàng cùng một trạng thái không phân biệt; chưa có bất kỳ chỉ báo nào hàng nào đang chọn (hàng đầu không khác các hàng còn lại), trái với claim "hàng đang chọn được đánh dấu".
- 1440, khối kết quả: Terminal nền tối đặc là mảng tối duy nhất của cả trang trắng, cao khoảng 100px chỉ để nói "Chưa có lần chạy nào"; tiêu đề "Kết quả gửi về từ máy bạn" 12 xám trên nền đen, tương phản thấp. Ngay trên có khối lệnh nền xám, hai khối nền tô liền nhau, một xám nhạt một đen.
- 1440, tiêu đề kịch bản đang chọn và đề "Kịch bản" cùng cỡ 14/500; chip "Chưa chạy" nền xám nhạt chữ nhạt. Hai tiêu đề lớn cạnh nhau ("Một lần thanh toán..." rồi "Kịch bản: chạy, tắt guard, xem lời hứa vỡ ở đâu") không phân cấp rõ.
- 1440, khối code: nền xám tô, chữ output (text) màu xám nhạt tương phản thấp, một số dòng bị cắt ở mép phải ("...30 orders through redeliveri"); nhãn "text"/"bash" và "Sao chép" 12 muted gần như vô hình; nút "Sao chép" lặp hơn hai mươi lần. Bảng cuối "Guard tắt" có tiêu đề nền xám, cột "Dòng sổ đối soát" ngắt giữa từ ("double-booked 11" xuống dòng, "stable-event-id" ngắt).
- 1920: Không thấy lỗi mới ở 1920; lỗi 1440 giữ nguyên (cú pháp `:::` rò, không dấu chọn hàng), cột nội dung ở giữa với lề trắng rất rộng, trang dài hơn 9300 px.
- 390: trang dài gần 12000 px; cú pháp `:::` vẫn rò; khối code và output rộng bị cắt hoặc buộc cuộn ngang, chữ tiếng Anh dài ngắt giữa từ; bảng "Guard tắt" ép ba cột hẹp, chữ code xuống từng mảnh; hàng danh sách kịch bản mô tả bị cắt "..." và chip "Chưa chạy" xuống dòng riêng.
