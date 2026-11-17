---
title: Bản chất / Chương: api-reliability
route: /essentials/[topic]
area: essentials
---

Route: `/essentials/api-reliability` (khớp `/essentials/[topic]`) (topic "Độ tin cậy của API"). Trang chương: dải đầu, một hero, danh sách bài và aside phải. Ảnh chụp ở 1440, 1920 và 390; khung (sidebar, thanh trên) thuộc lane khác. Code: `fe/apps/app/src/components/blocks/TopicDetail/component.tsx`, mapper `fe/apps/app/src/hooks/topic/topic.shared.ts`, composite `TopicHero`, `TopicPath`, `TopicAside` trong `fe/packages/starci-next-ui/src/composites/`.

## Dải đầu trang: trail, tiêu đề, meta

Vì sao: dải trắng sát lề trái, ngăn với thân trang bằng một đường kẻ 1px. Trail "Bản chất / Độ tin cậy của API" (mục hiện tại đậm), tiêu đề 18/600, dòng 12 muted "2 bài · 130 phút · TypeScript". Không chip, không nút, không tab: lệnh duy nhất của trang nằm trong hero.
Luật: `surface-layering` (luật 5: dải đầu sát trái, tiêu đề 18/600, mô tả 12 muted), `theme-and-type`.
Grammar: `Page header { title, breadcrumbs, meta }` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`).

## Hero: ảnh 3D, câu giới thiệu, nguồn, nút chính duy nhất

Vì sao: hero là một thẻ trắng viền hairline, không bóng, vì chương là một vật thật có ảnh bìa. Ảnh 3D trên nền tím nhạt ở bên trái (trang trí, `alt=""`), bên phải câu mô tả chương (500), dòng muted "Nguồn: ...", rồi đúng một nút chính "Bắt đầu: <bài>" bo tròn (pill) với icon play đứng đầu: nút chính duy nhất của màn hình. Nút trong ảnh có nền tím nhạt, chữ tối, không phải tím đặc như các nút chính khác (xem lỗi hình). Dưới 48rem ảnh xếp trên, chữ dưới, nút giữ nguyên.
Luật: `surface-layering` (luật 6: một nút chính mỗi màn hình, chỉ nút chính cỡ md/lg có icon đứng đầu; thẻ cho vật thật), `theme-and-type` (luật 1 và 3: mặt trắng, nút pill, tím chỉ là tín hiệu).
Grammar: `SurfaceCard` (children), `Grid kind="pair"`, `MediaFrame aspect="landscape" fit="cover"` + `Image alt=""`, `Button intent="commit" startContent={<Icon source={PlayGlyph} />}` (`composites/TopicHero/index.tsx`).

## "Bài trong chương" (head, chip đếm, danh sách đánh số)

Vì sao: nhãn 14/500 trên mặt trắng kèm chip đếm xám 12 là head của Section; thân là danh sách các bài, mỗi hàng ngăn bằng hairline: số thứ tự đơn cách, tên bài (500), dòng 12 muted "độ khó · phút · trạng thái" hoặc "Bài nguồn đang chuyển sang dạng tương tác". Cả hai bài đều mở. Bài đang mở có sáu vòng pha (vòng 1 viền tím là pha hiện tại, năm vòng còn lại xám) và "0/6 pha"; ở 390 các vòng xuống dòng dưới tên. Cả danh sách vẫn nằm trong một khung bo viền hairline (SurfaceCard), không bóng. CHƯA RÕ: theo luật danh sách phẳng dưới Section head thì khung viền này thừa; cần Grammar bỏ viền của `SurfaceCard kind="list"` hoặc đổi sang `Section`.
Luật: `surface-layering` (luật 1: danh sách là Section trên mặt trắng, không thẻ bao quanh; luật 3: nhãn khối là head của Section), `theme-and-type` (luật 6: chỉ 14 và 12).
Grammar: `SurfaceCard kind="list" label fact items { leading.position, control, href }` (`composites/TopicPath/index.tsx`), `Stepper size="dense" completeMarker="check"` cho sáu vòng pha (`composite/Stepper`), icon khoá outline cho bài chưa chuyển xong.

## Aside: Tiến độ, Nên biết trước, Topic liên quan

Vì sao: pane phải rộng 320, trắng, ngăn với thân bằng đường kẻ trái, các khối ngăn nhau bằng hairline, không thẻ. "Tiến độ" có dòng tóm tắt "2 bài · 130 phút · TypeScript" kèm phần trăm, thanh Meter mảnh và dòng muted "0/n bài đã hiểu"; "Nên biết trước" là các câu điều kiện; "Topic liên quan" là các link chữ thường, không mũi tên. Thanh tiến độ tô 100% trong khi "0/2 bài đã hiểu" (xem lỗi hình). Mockup có thêm "Chương này cho bạn" nhưng app chưa có dữ liệu nối bài với concept dự án nên lược bỏ.
Luật: `surface-layering` (luật 4: aside không làm bằng thẻ, section và hàng có divider), `theme-and-type` (luật 8: link điều hướng phụ là `variant="plain"`).
Grammar: `PaneGrid`, `Pane area="aside" surface`, `PaneSection rule="start"`, `Meter`, `Link variant="plain"` (`composites/TopicAside/index.tsx`).

## Phone (390)

Vì sao: dưới 48rem aside thành các khối đầu của trang (Tiến độ, Nên biết trước, Topic liên quan, mỗi khối ngăn hairline) rồi mới tới hero và danh sách; sidebar thu thành nút "Mở menu" ở đầu trang. Hero xếp ảnh trên, chữ dưới, nút rộng vừa chữ; hàng bài xuống dòng và sáu vòng pha nằm dưới tên.
Luật: `surface-layering` (luật 4: dưới lg các khối aside là những khối đầu của trang).
Grammar: `PaneGrid areas={{ base: ["aside", "main"], medium: ["main aside"] }}` (`frame/PaneGrid/index.d.ts`), `Grid kind="pair"` (`frame/Grid/index.d.ts`).
