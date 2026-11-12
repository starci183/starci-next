---
title: Bản chất / Chương (topic)
route: /essentials/[topic]
area: essentials
---

Route: `/essentials/backend-framework`. Trang chương theo mockup "A. Trang chương" (`D:/starci-tmp/codex-art/mockup/redesign.png`, nửa trên). Grammar dưới `node_modules/@starci/grammar/dist/core/`. Vòng "N / 1 Issue" là overlay của Next dev, không phải UI. Code: `fe/apps/app/src/components/blocks/TopicDetail/component.tsx`, mapper `fe/apps/app/src/hooks/topic/topic.shared.ts`, composite `TopicHero`, `TopicPath`, `TopicAside` trong `fe/packages/starci-next-ui/src/composites/`.

## Dải đầu trang: trail, tiêu đề, meta

Vì sao: dải trắng, sát trái. Trail "Bản chất / chương", tiêu đề 18, dòng 12 muted "n bài · x phút · k ngôn ngữ" (cộng từ các bài đã mở; chương không gắn ngôn ngữ chỉ còn "n bài · x phút"). Không còn chip nhóm và không còn nút ở band: lệnh duy nhất nằm trong hero.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header { title, breadcrumbs, meta }` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`).

## Hero: ảnh 3D của chương, câu giới thiệu, nút tím duy nhất

Vì sao: một card trắng nổi, ảnh bìa 3D bên trái (trang trí, `alt=""`, `public/art/topics/<topicId>.webp`), bên phải một dòng giới thiệu (500) là mô tả chương, dòng 12/14 muted nguồn, và đúng một nút tím `commit` có icon play: "Bắt đầu: <bài>" / "Học tiếp: <bài>" cho bài đầu tiên chưa hiểu, "Xem bài: ..." khi đã hiểu hết hoặc chưa có Premium. Tên bài lấy phần trước dấu "—".
Luật: `verify-against-visualize.md` (chỉ nút chính có icon), `pink-page-surface-rule.md`, `owner-colors-exact.md`.
Grammar: `SurfaceCard` (children), `Grid kind="pair"`, `MediaFrame aspect="landscape" fit="cover"` + `Image alt=""`, `Button intent="commit" startContent` (`frame/SurfaceCard`, `frame/Grid`, `leaf/MediaFrame`, `leaf/Image`, `leaf/Button`).

## Well: "Bài trong chương" (một card đánh số)

Vì sao: nhãn + chip đếm xám trên well, một `SurfaceCard kind="list"`: số thứ tự, tên bài (500), 12 muted "độ khó · phút · ngôn ngữ", cuối dòng sáu vòng pha (xong = dấu tick xanh, hiện tại = vòng accent có số, sau = vòng mờ, lấy từ `lessonProgress.phases`) cùng "n/6 pha", rồi chevron. Bài chưa chuyển xong có ổ khóa outline. Chưa có Premium: không vòng, dùng chip trạng thái.
Luật: `table-heroui-native-section-head.md`, `surfacecard-zones-api.md`, `type-scale-14-12.md`.
Grammar: `SurfaceCard kind="list" items { leading.position, control, href }`, `Stepper size="dense" completeMarker="check"` (`frame/SurfaceCard`, `composite/Stepper`). Vì sao: CHƯA RÕ về một chỗ: Stepper bắt buộc có nhãn, vòng không có chữ nên nhãn là hai khoảng trắng em để các vòng có khoảng thở; cần Grammar một Stepper "chỉ vòng" hoặc `StepMark` công khai.

## Aside: Tiến độ, Nên biết trước, Topic liên quan

Vì sao: pane phải 320, nền trắng, section ngăn bằng hairline. KHÁC mockup: mockup có "Chương này cho bạn" (dòng kinh nghiệm + concept dự án) nhưng ứng dụng chưa có dữ liệu nối bài với concept hoặc dòng kinh nghiệm của chương (`projectCatalog.concepts` không có liên kết tới bài), nên lược bỏ theo yêu cầu; giữ ba khối cũ.
Luật: `nivo-surface-layering.md`, `pink-page-surface-rule.md`.
Grammar: `PaneGrid`, `Pane area surface`, `PaneSection rule="start"`, `Meter`, `Link`.

## Phone (390)

Vì sao: dưới 48rem aside thành các khối đầu của well; hero xếp ảnh trên, chữ dưới; vòng pha xuống dòng dưới tên bài.
Luật: `pink-page-surface-rule.md`.
