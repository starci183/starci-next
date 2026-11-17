---
title: Dự án (giới thiệu, chưa đăng ký Premium)
route: /projects
area: projects
reviewed: 2026-11-17
---

Route: `/projects` và mọi màn hình con của nó. Dự án chỉ dành cho người đăng ký Premium (owner 2026-11-17): người chưa đăng ký không thấy một công cụ bị cắt bớt, không có bộ đếm miễn phí, chỉ thấy trang giới thiệu và một nút đăng ký. Cổng nằm ở một chỗ, `features/layouts/ProjectsLayout`; back end vẫn từ chối cùng các cửa, màn hình chỉ nói thành lời. Ảnh chụp cần một tài khoản đã đăng nhập nhưng chưa có Premium (`CAPTURE_FREE_STATE`). Mã: `fe/apps/app/src/components/blocks/ProjectsPitch/`. Grammar 0.40.1, đường dẫn trong `node_modules/@starci/grammar/dist/core/`.

## Dải đầu trang (tiêu đề, một câu mô tả, nút Đăng ký Premium)

Vì sao: nói ngay Dự án chứng minh điều gì (repo của chính bạn, concept đã chứng minh, một dòng CV đã xác minh) và nút chính duy nhất là "Đăng ký Premium", dẫn tới trang gói. Không có nút "Tạo dự án" ở đây vì không có công cụ nào để dùng thử.
Luật: `premium.md` (Premium là cửa duy nhất; Dự án chỉ trong gói), `projects.md`, `theme-and-type.md` (một nút chính mỗi màn hình).
Grammar: `Page header={{ breadcrumbs: "root", title, description, actions }}` (`frame/Page/index.d.ts`), `Button intent="commit" href` (`leaf/Button/index.d.ts`).

## Từ repo của bạn đến dòng CV (ba bước)

Vì sao: ba hàng đánh số trong một danh sách phẳng, không thẻ: mang repo vào (không có dự án mẫu), chứng minh từng concept (Đang luyện trên máy, Đã chứng minh khi CI GitHub ký OIDC hoặc server chạy lại), nhận dòng CV xác minh. Mỗi hàng là một câu, không phải một tính năng.
Luật: `surface-layering.md` (danh sách đứng thẳng trên nền trang, ngăn bằng đường kẻ), `learner-cli-relay.md` (luyện qua relay, chứng minh bằng CI ký), `projects.md`.
Grammar: `Section kind="list" items[{ title, description, leading: { position } }]` (`frame/Section/index.d.ts`).

## Ví dụ: bảng concept của một milestone

Vì sao: cho người xem thấy trước màn hình họ sẽ có: concept, ô bằng chứng cần (test, probe, e2e, CI) và trạng thái (Đã chứng minh, Đang luyện, Chưa bắt đầu). Dữ liệu minh hoạ, ghi rõ ở dòng chú thích dưới bảng; không phải dự án của ai.
Luật: `surface-layering.md` (bảng là tập hợp, không bao bằng thẻ), `verified-experience.md` (hai mức Đang luyện và Đã chứng minh).
Grammar: `Section title caption` bọc `DataTable surface="none"` (`branch/DataTable/index.d.ts`, mặc định phẳng từ 0.40.0), `Badge tone` (`leaf/Badge/index.d.ts`).

## Ví dụ: dòng CV khi đủ bằng chứng

Vì sao: dòng CV là kết quả cuối của cả quy trình, nên đặt trước mắt: vai trò, nhãn "Đã xác minh", một câu mô tả, và dòng muted nói bằng chứng nào đứng sau (CI run GitHub ký, ngày probe, số concept). Không có số tự khai.
Luật: `verified-experience.md` (chỉ bằng chứng đã kiểm mới thành dòng CV), `theme-and-type.md` (dòng phụ 12 muted).
Grammar: `Stack gap="identity"`, `Text isStrong`, `Badge tone="success"`, `Text size="sm" tone="muted"`.

## Premium mở những gì ở Dự án

Vì sao: bốn hàng ngắn trả lời "đăng ký thì được gì": nhiều dự án, probe trên địa chỉ deploy, AI đọc code, CI có chữ ký. Hàng cuối trang, không thêm nút chính thứ hai.
Luật: `premium.md`, `theme-and-type.md`.
Grammar: `Section kind="list" items[{ title, description }]`.

## Trạng thái đang tải

Vì sao: trong lúc đọc quyền Premium, trang giữ khung trống đang tải, không nháy công cụ rồi mới đổi sang trang giới thiệu.
Luật: `surface-layering.md`.
Grammar: `Page isLoading` (`frame/Page/index.d.ts`).
