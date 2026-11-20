# Chi tiết build  (gallery: harness/build, route /harness/build/[build])
Mục tiêu: đi hết một bản build và nối repo của mình.
Thao tác: harnessBuild (runtime: dir, install, e2e, report; keys; repository: bound, repository, audience; stages với e2e từng ca: state, passed, commit, at; steps; lastRunAt, lastWhy); bindHarnessBuild(buildId, repository) trả audience OIDC để chép. cần API: unbindHarnessBuild (gỡ repo; chặng đã chứng minh giữ nguyên).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/35-harness-build.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/build (Chi tiết build, đã nối repo; 1440 và 390); harness/build-connect-not-linked (Chi tiết build, kết nối repo, chưa nối; chỉ 390); harness/build-connect-waiting-ci (Chi tiết build, kết nối repo, chờ kết quả CI; chỉ 390); harness/build-connect-bad-url (Chi tiết build, kết nối repo, địa chỉ sai; chỉ 390); harness/build-loading (Chi tiết build, đang tải; 1440 và 390); harness/build-error (Chi tiết build, lỗi tải; chỉ 390); harness/build-not-linked (Chi tiết build, chưa nối repo; 1440 và 390); harness/build-waiting-ci (Chi tiết build, chờ kết quả CI; 1440 và 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: Trái: bốn lệnh chạy trên máy (có nút Chép) và năm chặng; chặng đang chọn mở bảng ca e2e với công tắc "Chỉ hiện ca chưa xanh", terminal lần chạy gần nhất và hướng dẫn đánh số bước; chặng sau khóa tới khi chặng trước xanh.
Grammar: PageHeader, Section, DataTable, Switch, Terminal, CopyField, Input, Button, Stepper, Badge, Alert, SurfaceCard. cần Grammar: không có.
Hành động chính: "Tiếp tục chặng 3".
Lọc: công tắc "Chỉ hiện ca chưa xanh".
Việc đổi: tách "đang luyện" (xanh trên máy) khỏi "đã chứng minh" (xanh trên CI qua OIDC); e2e đỏ nói thẳng ca nào hỏng và vì sao.
Xung đột: audience riêng cho từng học viên; nhập lại repo là gọi lại bindHarnessBuild.
