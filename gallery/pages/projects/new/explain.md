---
title: Dự án / Tạo dự án
route: /projects/new
area: projects
---

Route: `/projects/new`, dành cho người đăng ký Premium. Hai nửa: bên trái biểu mẫu, bên phải bảng "init" với các lệnh chạy trong repo của học viên. Mã: `fe/apps/app/src/components/blocks/ProjectNew/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (đường dẫn, tiêu đề, mô tả)

Vì sao: đường dẫn "Dự án / Tạo dự án" đưa về danh sách; một câu nói ba việc cần làm (đặt tên, nối repo và địa chỉ deploy, chạy một lệnh). Nút chính nằm trong biểu mẫu, nên đầu trang không có nút.
Luật: `theme-and-type.md` (một nút chính mỗi màn hình), `projects.md`.
Grammar: `Page header={{ breadcrumbs: { label, items }, title, description }}`.

## Biểu mẫu: tên, loại, repo, địa chỉ deploy

Vì sao: bốn trường đúng như bản vẽ: tên dự án, loại App hoặc Agent (một nhóm radio ngang; chọn Agent thì hiện thêm công cụ agent), repo GitHub, địa chỉ deploy tùy chọn để probe (kèm gợi ý "http hoặc https công khai"). Không hỏi đề tài, ngôn ngữ hay công nghệ: StarCi không áp kiến trúc lên repo. Địa chỉ deploy được lưu ngay sau khi tạo (cửa tạo chưa nhận trường này); nếu lưu hỏng thì dự án và bí mật CI vẫn còn và lời nhắn bảo lưu lại ở trang dự án.
Luật: `projects.md` (không bắt học viên theo khuôn), `theme-and-type.md`.
Grammar: `Section title`, `Input kind="text" description`, `RadioGroup orientation="horizontal"`, `Alert tone="negative"`, `Button intent="commit" startGlyph="plus"` và `Button intent="neutral"` (Huỷ).

## Bảng init: lệnh chạy trong repo của bạn

Vì sao: cột bên phải là một terminal tối cho các lệnh `npx @starci/next init <tên>` (tên theo ô đang gõ) và `starci-next run`, kèm kết quả mẫu: thêm `starci/project.yaml`, `starci/e2e/*.md`, mẫu CI; chạy cho thấy concept đang luyện. Dòng muted dưới nhắc code do bạn hoặc AI của bạn viết, StarCi chỉ đọc tag trong test và chạy probe.
Luật: `learner-cli-relay.md` (luyện qua relay, không phải bằng chứng), `projects.md` (không ép harness lên repo).
Grammar: `Grid kind="pair" leading trailing`, `Terminal label lines` (`branch/Terminal/index.d.ts`), `Text size="sm" tone="muted"`.

## Sau khi tạo: bí mật CI hiện một lần

Vì sao: biểu mẫu được thay bằng thông báo, ô chỉ đọc có nút sao chép chứa bí mật CI (lưu vào GitHub Secrets với tên `STARCI_PROJECT_SECRET`) và nút "Mở dự án". Bảng init vẫn ở bên phải để chạy lệnh ngay.
Luật: `projects.md`, `learner-cli-relay.md`.
Grammar: `Alert tone="informative"`, `Input isReadOnly isCopyable`.
