---
title: Dự án / Tạo dự án
route: /projects/new
area: projects
reviewed: 2026-11-17
---

Route: `/projects/new`, dành cho người đăng ký Premium. Hai nửa: bên trái biểu mẫu, bên phải bảng "init" với các lệnh chạy trong repo của học viên; ở 390 hai nửa xếp dọc, bảng init nằm dưới. Mã: `fe/apps/app/src/components/blocks/ProjectNew/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (đường dẫn, tiêu đề, mô tả)

Vì sao: đường dẫn "Dự án / Tạo dự án" đưa về danh sách; một câu nói ba việc cần làm (đặt tên, chọn loại, nối repo và địa chỉ deploy, rồi chạy một lệnh). Nút chính nằm trong biểu mẫu, nên đầu trang không có nút.
Luật: `theme-and-type.md` (một nút chính mỗi màn hình), `projects.md`.
Grammar: `Page header={{ breadcrumbs: { label, items }, title, description }}`.

## Biểu mẫu "Thông tin dự án"

Vì sao: bốn trường: Tên dự án, Loại dự án (nhóm radio ngang Ứng dụng hoặc Agent, mặc định Ứng dụng), Repo GitHub, Địa chỉ deploy (tùy chọn, để probe, kèm gợi ý 12 muted "http hoặc https công khai"). Dưới là nút chính "Tạo dự án" (mờ khi chưa đủ trường) và nút neutral "Huỷ". Không hỏi đề tài, ngôn ngữ hay công nghệ: StarCi không áp kiến trúc lên repo. Địa chỉ deploy được lưu ngay sau khi tạo; nếu lưu hỏng thì dự án và bí mật CI vẫn còn.
Luật: `projects.md` (không bắt học viên theo khuôn), `theme-and-type.md` (một ô một kiểu, một nút chính).
Grammar: `Section title`, `Input kind="text" description` (qua `TextField`), `RadioGroup orientation="horizontal"`, `Button intent="commit" startGlyph="plus"` và `Button intent="neutral" href` (Huỷ).

## Bảng init "Rồi chạy trong repo của bạn"

Vì sao: cột bên phải là một Section có terminal tối cho các lệnh `npx @starci/next init <tên>` (tên theo ô đang gõ, mặc định `my-project`) và `starci-next run`, kèm kết quả mẫu: thêm `starci/project.yaml`, `starci/e2e/*.md`, mẫu CI; chạy cho thấy concept đang luyện. Dòng muted dưới nhắc code do bạn hoặc AI của bạn viết, StarCi chỉ đọc tag trong test và chạy probe.
Luật: `learner-cli-relay.md` (luyện qua relay, không phải bằng chứng), `projects.md` (không ép harness lên repo).
Grammar: `Grid kind="pair" leading trailing`, `Terminal label lines` (`branch/Terminal/index.d.ts`), `Text size="sm" tone="muted"`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, 1920, 390, biểu mẫu: ba ô Tên dự án, Repo GitHub, Địa chỉ deploy trống không có placeholder, hiện như hộp trắng viền mảnh không gợi ý nội dung; riêng Địa chỉ deploy có gợi ý ở dưới còn hai ô kia không có gì.
- 1440, 1920, 390, nút "Tạo dự án": nút chính mờ (tím rất nhạt) với chữ và dấu cộng gần như không đọc được; không có lý do hiển thị vì sao bị khoá.
- 1440 và 1920, biểu mẫu: khoảng cách dọc không đều, nhóm "Loại dự án" nằm sát nhãn "Repo GitHub" bên dưới (chưa tới 20px) trong khi các nhóm khác cách xa hơn.
- 1440 và 1920, nút "Huỷ" có viền riêng cạnh nút chính khiến hàng nút trông là hai pill xếp sát nhau.
- 1440 và 1920, bảng init: terminal nền đen đặc là một khối tối lớn trên trang trắng, nặng hơn mọi thứ khác trong màn hình; chữ mono cỡ không thuộc thang 14/12.
- 1440, bảng init: khối terminal bắt đầu ở y=290 còn ô đầu tiên của biểu mẫu ở y=316, hai tiêu đề Section ngang nhau nhưng thân không thẳng hàng.
- 1920, dải đầu trang canh trái ở x=288 trong khi biểu mẫu và bảng init bị giới hạn bề rộng và bắt đầu ở x=480: mép trái lệch 192px.
- 1920, vùng trống phía dưới bảng init rất lớn so với biểu mẫu; hai cột cao không bằng nhau.
- 390, terminal: dòng "request-response-lifecycle 2 test đang luyện" bị ngắt giữa cụm ("đang / luyện", "chưa / có bằng chứng") làm bảng kết quả mất thẳng hàng.
- 390, bảng init nằm sau nút "Tạo dự án" nên người dùng phải cuộn qua nút chính mới thấy hướng dẫn chạy lệnh.
- Lần chụp lại 2026-11-17 trên dev (học viên Premium thử): biểu mẫu chỉ có Tên dự án, Loại dự án, Repo GitHub, Địa chỉ deploy; bấm Tạo dự án thành công và hiện bí mật CI một lần. Không còn ô đề tài, ngôn ngữ, công nghệ: server nhận rỗng. Các điều trên vẫn đúng ở 1440 và 390, trừ hàng dưới.
- 1440 và 390, ô Repo GitHub không nói chỉ địa chỉ github.com mới nối được chứng thực CI (OIDC); không có placeholder nên học viên không biết dạng `https://github.com/chủ/tên`.
