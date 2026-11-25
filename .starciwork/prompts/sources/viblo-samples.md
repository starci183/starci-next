# Viblo samples: 50 bài đã đọc (2026-11-24)

Nguồn cho [viet-dev-blog-voice.md](viet-dev-blog-voice.md). Đọc bằng trình duyệt có sẵn, không đăng nhập, không bình luận.
44 bài lấy từ https://viblo.asia/newest (trang 1–7, đăng trong khoảng 20–24/11/2026), 6 bài từ https://viblo.asia/editors-choice (2024)
để có thêm system design, phỏng vấn và giọng hài cũ của cộng đồng. Bỏ qua bài tiếng Anh, tiếng Nhật, tiếng Trung và series HTML/CSS
toàn tiêu đề dài kiểu SEO.

Mỗi dòng: tiêu đề, URL, một ghi chú. Trích dẫn chỉ là cụm ngắn để làm dấu; phần còn lại là diễn giải.
Nhãn: **[tự nhiên]** đáng học, **[lẫn]** có chỗ hay có chỗ dở, **[dịch/AI]** đọc ra văn dịch hoặc văn mẫu, **[quảng cáo]** bài
quảng cáo đội lốt kỹ thuật.

## Câu chuyện debug, postmortem, đo đạc

1. **[tự nhiên]** "Port 3000 is already in use": mình viết tool xem port nào đang mở...
   https://viblo.asia/p/port-3000-is-already-in-use-minh-viet-tool-xem-port-nao-dang-mo-va-cach-moi-he-dieu-hanh-cho-biet-ai-dang-giu-port-3RL1BbR8Vao
   Mở bằng nguyên dòng lỗi EADDRINUSE sau câu "Chắc ai làm web cũng từng gặp cảnh này". Chi tiết đời thường ("cả quán cà phê vào
   được"), "Bất ngờ 1 / Bất ngờ 2", kết "Anh em dùng thử".
2. **[tự nhiên]** Đừng đổi IN sang EXISTS cho nhanh nữa. Quả bom thật tên là NOT IN
   https://viblo.asia/p/dung-doi-in-sang-exists-cho-nhanh-nua-qua-bom-that-ten-la-not-in-pPLkN8k8JRZ
   Mở từ một góp ý lúc review, "Mình đo thử". Đo thật (200.000 đơn, trung vị 3 lần), dán plan, bảng thời gian. Tự giễu nhẹ
   ("suýt sửa code luôn mà không cần đo =))"). Kết bằng một lệnh grep làm được ngay hôm nay.
3. **[tự nhiên]** Bẫy chi phí AWS #09: Vòng lặp Lambda ghi lại vào S3 đốt $390 chỉ trong một đêm
   https://viblo.asia/p/bay-chi-phi-aws-09-vong-lap-lambda-ghi-lai-vao-s3-dot-390-chi-trong-mot-dem-wlVmR59r45Z
   Câu mở ba nhịp: "Một đêm, $390, và không ai trong team thức". Khung Bối cảnh / Vì sao tốn tiền / Hóa đơn / Cách sửa / Lưu ý /
   Checklist. Bảng tính tiền từng khoản.
4. **[tự nhiên]** Một bước phê duyệt tốn 6 phút: đọc lại đồng hồ của Codex trong T3 Code
   https://viblo.asia/p/mot-buoc-phe-duyet-ton-6-phut-doc-lai-dong-ho-cua-codex-trong-t3-code-R5JRQrzY4Gv
   Giọng "tôi", câu ngắn, số đến từng giây. Tách "chậm" và "kém" thành hai câu hỏi. Hơi có mùi quảng cáo endpoint ở dòng đầu.
5. **[tự nhiên]** Bài toán N+1 queries và điểm D hồi đại học? (editors' choice)
   https://viblo.asia/p/bai-toan-n1-queries-va-diem-d-hoi-dai-hoc-m2vJPoRq4eK
   Kể chuyện bị thầy chấm, có thoại. "Thôi xong...!" Hài vì thật, không vì cố. Kết bằng bài học đời: đừng cãi khi chưa chắc.
6. **[tự nhiên]** Chrome DevTools MCP là gì? Cho AI agent mở Chrome thật để debug thay vì đoán mò
   https://viblo.asia/p/chrome-devtools-mcp-la-gi-cho-ai-agent-mo-chrome-that-de-debug-thay-vi-doan-mo-k74a96A94eO
   Mở bằng cảnh "Bấm 'Lưu', không có gì xảy ra", agent đoán mò. "cái request đỏ lòm". Bảng "Bạn hay làm / Tool tương ứng".
7. **[tự nhiên]** Kiểm định 38.884 kỳ xổ số Việt Nam...
   https://viblo.asia/p/kiem-dinh-38884-ky-xo-so-viet-nam-khi-binh-phuong-bai-toan-ngay-sinh-va-cai-bay-nhin-truoc-tuong-lai-ZoJjeO9z4Y7
   Con số ngay tiêu đề, ba câu hỏi người chơi hay tin. Nói thẳng site do AI dựng. Ghi chú bẫy dữ liệu (vé 5 chữ số những năm đầu).
8. **[lẫn]** Tăng độ song song của MySQL CDC lên 8: Vì sao cả 8 reader cùng đọc một bảng?
   https://viblo.asia/p/tang-do-song-song-cua-mysql-cdc-len-8-vi-sao-ca-8-reader-cung-doc-mot-bang-AY4qQqbe4Pw
   Mở tốt: "Bộ phân bổ có lỗi ư? Chưa chắc." Thân bài nặng danh từ ("việc định tuyến, đệm và commit của writer có nhịp riêng") và
   dùng "lượt đọc" thay cho read/request.
9. **[lẫn]** Làm mini game nông trại 3D với claudefable5.2...
   https://viblo.asia/p/lam-mini-game-nong-trai-3d-voi-claudefable52-thinking-chiem-het-output-ban-dau-mo-the-nao-AoJe8MmA41j
   Giọng "tôi" thẳng, nói rõ phạm vi ("Tôi không kể chuyện mài nó thành sản phẩm"). Vài câu dịch ("phần nào đứng trước, phần nào
   dừng lại"), lặp "tài liệu chính thức".

## Giải thích khái niệm, series

10. **[tự nhiên]** Thuật toán & CTDL #08: Sliding Window...
    https://viblo.asia/p/thuat-toan-ctdl-08-sliding-window-truot-mot-o-chi-can-mot-phep-tru-va-mot-phep-cong-18J2ewme4YK
    "Đề bài nghe rất hiền". Bảng chạy tay từng cửa sổ. Chỉ đúng chỗ dễ sai (a[i - k]). Mục "Khi nào dùng, khi nào không".
11. **[tự nhiên]** Thuật toán & CTDL #07: Two Pointers - đừng viết 2 vòng for lồng nhau trong phỏng vấn
    https://viblo.asia/p/thuat-toan-ctdl-07-two-pointers-dung-viet-2-vong-for-long-nhau-trong-phong-van-K9Vy8raXLQR
    Đặt người đọc vào phòng phỏng vấn, câu hỏi nối "Làm nhanh hơn được không?". "34 cặp" so với "6 bước". Chứng minh vì sao không sót.
12. **[tự nhiên]** Thuật toán & CTDL #06: Binary Search - tìm 1 phần tử trong 1 tỷ chỉ cần 30 bước
    https://viblo.asia/p/thuat-toan-ctdl-06-binary-search-tim-1-phan-tu-trong-1-ty-chi-can-30-buoc-wd43EpqwLX9
    Câu hỏi mở "chỉ cần 30 câu hỏi?". Động từ khẩu ngữ "Vứt luôn cả nửa trái".
13. **[tự nhiên]** Thuật toán & CTDL #05: Quick Sort - chọn chốt tệ là rơi thẳng về O(n²)
    https://viblo.asia/p/thuat-toan-ctdl-05-quick-sort-chon-chot-te-la-roi-thang-ve-on2-y0VGwQb0VPA
    Ẩn dụ "bức tường" chạy suốt bảng chạy tay. "pivot" giữ tiếng Anh trong ngoặc một lần, sau đó gọi "chốt".
14. **[tự nhiên]** Thuật toán & CTDL #01: Bubble Sort - thuật toán ai cũng học đầu tiên nhưng gần như không ai dùng thật
    https://viblo.asia/p/thuat-toan-ctdl-01-bubble-sort-thuat-toan-ai-cung-hoc-dau-tien-nhung-gan-nhu-khong-ai-dung-that-oKLnqOMGJQO
    Số gây sốc ở câu ba (500 tỷ phép so sánh). Đếm chính xác 25 lần so sánh cho 8 phần tử.
15. **[tự nhiên]** Base64 làm dữ liệu "phình" thêm bao nhiêu?
    https://viblo.asia/p/base64-lam-du-lieu-phinh-them-bao-nhieu-cach-tinh-chinh-xac-kich-thuoc-sau-khi-ma-hoa-Nj4vg5AOJ6r
    Ngắn, đúng một ý. Ví dụ "Hà Nội" 9 byte. Kết "Tóm lại" một câu, ghi đã kiểm bằng Python.
16. **[tự nhiên]** ACID là gì? 4 thuộc tính vàng...
    https://viblo.asia/p/acid-la-gi-4-thuoc-tinh-vang-dam-bao-do-tin-cay-cho-giao-dich-co-so-du-lieu-yZJZlG58Vjm
    "Hãy tưởng tượng bạn chuyển 5 triệu đồng", một ví dụ dùng xuyên suốt cả bốn chữ. Thành ngữ "Được ăn cả, ngã về không".
17. **[lẫn]** Consistency trong ACID vs. Consistency trong định lý CAP: Cùng chữ "C", hai thế giới khác nhau
    https://viblo.asia/p/consistency-trong-acid-vs-consistency-trong-dinh-ly-cap-cung-chu-c-hai-the-gioi-khac-nhau-gjLN0Bn7432
    Ý hay, câu chốt "Nói ngắn gọn:". Nhưng mở kiểu văn mẫu ("có một cái bẫy kinh điển khiến rất nhiều lập trình viên") và nhiều câu
    danh hóa.
18. **[lẫn]** Series Go Backend: Panic, Recover và Defer
    https://viblo.asia/p/series-go-backend-panic-recover-va-defer-quan-ly-luong-thuc-thi-khi-xay-ra-su-co-ym400lbj491
    Ví dụ code tốt, ẩn dụ "Kẻ trì hoãn". Lạm dụng ngoặc tiếng Anh viết hoa ("(Resource Cleanup)", "(Crash)") và tính từ cường điệu
    ("cực kỳ mạnh mẽ").
19. **[lẫn]** Series Go Backend: Tìm hiểu về Generics trong Go 1.18+
    https://viblo.asia/p/series-go-backend-tim-hieu-ve-generics-trong-go-118-type-parameters-XP4WEd9qL7G
    Mục "Nỗi đau trước khi có Generics", "cắn răng viết thêm". Nhưng "giải quyết triệt để", "mang lại sự linh hoạt tuyệt vời" là
    văn quảng cáo.
20. **[lẫn]** Ngôn ngữ biên dịch và Ngôn ngữ thông dịch
    https://viblo.asia/p/ngon-ngu-bien-dich-va-ngon-ngu-thong-dich-co-che-hoat-dong-va-su-khac-biet-bA468WNlLKv
    Ẩn dụ dịch cả cuốn sách là được. Câu mở giáo trình: "Về bản chất,... bắt buộc phải được chuyển đổi... thông qua hai cơ chế cốt lõi".
21. **[lẫn]** 3 Cách Giao Tiếp Phổ Biến Trong Microservices
    https://viblo.asia/p/3-cach-giao-tiep-pho-bien-trong-microservices-http-grpc-va-message-queue-ZoJjeOmO4Y7
    "Điểm ăn tiền" là khẩu ngữ tốt. Còn lại là khung Ưu/Nhược/Khi nào dùng chung chung, viết hoa kiểu tiếng Anh ở tiêu đề.
22. **[tự nhiên]** Làm thế nào mà máy tính có thể phân biệt được một file là image hay text? (editors' choice)
    https://viblo.asia/p/lam-the-nao-ma-may-tinh-co-the-phan-biet-duoc-mot-file-la-image-hay-text-zOQJwoy0JMP
    Câu hỏi ngây thơ rồi lật lại. "có nhiều đất diễn hơn". Có lỗi chính tả ("điều" thay "đều"), nhắc rằng tự nhiên không có nghĩa là cẩu thả.
23. **[lẫn]** Autocomplete - Bài toán kinh điển trong các hệ thống tìm kiếm (editors' choice)
    https://viblo.asia/p/autocomplete-bai-toan-kinh-dien-trong-cac-he-thong-tim-kiem-gwd43jOjVX9
    Dùng "xâu" (từ dân thi thuật toán) thay "chuỗi", yêu cầu liệt kê kèm ngoặc tiếng Anh. Khối quảng cáo group chen giữa bài.

## Hướng dẫn công cụ, cài đặt, vận hành

24. **[tự nhiên]** Graphify là gì? Lần đầu cài thử, biến cả repo thành bản đồ để hỏi thay vì grep
    https://viblo.asia/p/graphify-la-gi-lan-dau-cai-thu-bien-ca-repo-thanh-ban-do-de-hoi-thay-vi-grep-8X4EjBrzJN2
    Cảnh agent grep 40 kết quả, mở 12 file. Mục "nói cho dễ hiểu" với ẩn dụ bản đồ tàu điện, rồi mới "Dân trong nghề gọi...". Ghi
    phiên bản, hệ điều hành, ngày chạy. Cảnh báo tên package gõ thiếu chữ y.
25. **[tự nhiên]** Impeccable là gì? Công cụ bắt "mùi AI" trong giao diện trước khi bạn ship
    https://viblo.asia/p/impeccable-la-gi-cong-cu-bat-mui-ai-trong-giao-dien-truoc-khi-ban-ship-bNVQGkMoJvR
    "mười lần thì tám lần ra cùng một kiểu", tả cụ thể gradient tím, card, nút phát sáng. Giải thích "deterministic" bằng ESLint.
26. **[tự nhiên]** Flask: tách template và static riêng cho từng Blueprint
    https://viblo.asia/p/flask-tach-template-va-static-rieng-cho-tung-blueprint-het-canh-templates-phinh-to-trong-5-phut-2vJPdvKxJeK
    Vấn đề trước, "Cách chữa cháy thường thấy", rồi cách làm. Comment trong code nói như người ("của admin hay shop?").
27. **[tự nhiên]** JavaScript: Đọc và tạo query string an toàn với URLSearchParams trong 5 phút
    https://viblo.asia/p/javascript-doc-va-tao-query-string-an-toan-voi-urlsearchparams-trong-5-phut-kNLr3pBlVgA
    Dữ liệu Việt ("áo thun nam", "đồ ăn & uống") làm lộ bug. "bug đã âm thầm nằm đó".
28. **[tự nhiên]** Tạo swap cho server Linux: hướng dẫn từng bước...
    https://viblo.asia/p/tao-swap-cho-server-linux-huong-dan-tung-buoc-voi-swapfile-swappiness-va-cach-kiem-tra-3RL1Bbm7Vao
    Câu đầu hơi SEO, nhưng câu hai nói hậu quả thật: tiến trình bị tắt "thường là MySQL", "tức là website sập". Khung "Bài này giúp
    bạn" và "Môi trường mẫu".
29. **[tự nhiên]** CDN báo lỗi SSL: 5 nguyên nhân thường gặp...
    https://viblo.asia/p/cdn-bao-loi-ssl-5-nguyen-nhan-thuong-gap-va-cach-kiem-tra-nhanh-bang-curl-openssl-XRJ8RYE9VGq
    Ý "hai chặng" thành một bảng nhỏ. "câu hỏi đầu tiên luôn là". Mỗi nguyên nhân có lệnh kiểm tra.
30. **[tự nhiên]** Dấu hiệu server đang thiếu CPU...
    https://viblo.asia/p/dau-hieu-server-dang-thieu-cpu-doc-load-average-top-vmstat-va-phan-biet-voi-thieu-ram-1XVOWBdPVMz
    "Nâng CPU khi vấn đề nằm ở ổ đĩa là tốn tiền mà website vẫn chậm". Ghi rõ số trong bài là ví dụ, không phải số đo.
31. **[tự nhiên]** Namespace trong Kubernetes là gì?...
    https://viblo.asia/p/namespace-trong-kubernetes-la-gi-cach-chia-cum-theo-team-va-moi-truong-kem-yaml-quota-rbac-k74a96eA4eO
    "không giẫm lên nhau", cảnh ba team cùng deploy. Nói rõ namespace làm được gì và không làm được gì.
32. **[tự nhiên]** Medusa v2: hiểu module và workflow trước khi viết dòng code đầu tiên
    https://viblo.asia/p/medusa-v2-hieu-module-va-workflow-truoc-khi-viet-dong-code-dau-tien-y0VGwQ8yVPA
    "bạn sẽ thấy khó chịu khá sớm". Nói stack của chính mình (shop eSIM). Câu ngắn, chủ động.
33. **[tự nhiên]** Tính âm lịch Việt Nam bằng code: năm điều không thể đơn giản hóa
    https://viblo.asia/p/tinh-am-lich-viet-nam-bang-code-nam-dieu-khong-the-don-gian-hoa-wd43Ep1XLX9
    Ví dụ rất Việt (lịch giỗ, quà Rằm, khuyến mãi mùng Một). "sai vào đúng những ngày người dùng quan tâm nhất". Kết bằng lời khuyên
    production.
34. **[tự nhiên]** Changelog là gì và cách viết để người dùng thật sự đọc
    https://viblo.asia/p/changelog-la-gi-va-cach-viet-de-nguoi-dung-that-su-doc-kem-tool-mien-phi-lZL9XY1WJQK
    Tự khai là người làm tool, "bạn cứ đọc với con mắt đó nhé". Ví dụ đúng/sai trong một câu.
35. **[tự nhiên]** Làm phần mềm quản lý máy tính cho con trên Windows...
    https://viblo.asia/p/lam-phan-mem-quan-ly-may-tinh-cho-con-tren-windows-hosts-applocker-named-pipe-va-cap-nhat-co-chu-ky-kNLr3pA8VgA
    Mở bằng lời phụ huynh "chặn game cho con". Nói trước bài không quảng cáo mà kể quyết định kỹ thuật. Giữ nguyên tên API Windows.
36. **[lẫn]** Học AWS cho sinh viên nghèo vượt khó...
    https://viblo.asia/p/hoc-aws-cho-sinh-vien-ngheo-vuot-kho-thuc-hanh-cloud-khong-lo-hoa-don-1XVOWBy6VMz
    Câu hỏi mở chạm nỗi lo hóa đơn, nhưng sau đó là chuỗi "Đây là một bước tiến thú vị", "Điều đặc biệt là", "Việc học và thực hành".

## Chi phí, series AWS

37. **[tự nhiên]** Bẫy chi phí AWS #11: Step Functions Standard tốn $250/tháng, Express chỉ khoảng $3
    https://viblo.asia/p/bay-chi-phi-aws-11-step-functions-standard-ton-250thang-express-chi-khoang-3-AoJe8MWA41j
    "chỉ bằng cách đổi một chữ". Phép tính hai dòng. Lưu ý khi nào giữ Standard. Câu hỏi cuối hỏi đúng chuyện của team người đọc.
38. **[tự nhiên]** Bẫy chi phí AWS #06: Đặt database ở public subnet...
    https://viblo.asia/p/bay-chi-phi-aws-06-dat-database-o-public-subnet-vua-lo-ra-internet-vua-ton-636thang-R5JRQrGz4Gv
    Mở bằng câu nói quen ở team ("cho dễ, dev ở nhà cũng connect được"). "bot trên Internet có thể gõ cửa".
39. **[tự nhiên]** Bẫy chi phí AWS #05: Phí IPv4 public, nửa xu mỗi giờ thành $1.095 mỗi năm
    https://viblo.asia/p/bay-chi-phi-aws-05-phi-ipv4-public-nua-xu-moi-gio-thanh-1095-moi-nam-37Lde95mVov
    "$0,005 một giờ. Con số nhỏ đến mức không ai để ý." Hai câu ngắn mở, rồi phép nhân.

## Phỏng vấn, system design

40. **[tự nhiên]** Event loop trong Javascript, microtask, macrotask, Promise và các câu hỏi phỏng vấn phổ biến (editors' choice)
    https://viblo.asia/p/event-loop-trong-javascript-microtask-macrotask-promise-va-cac-cau-hoi-phong-van-pho-bien-GyZJZjrbJjm
    Giọng anh lớn trong cộng đồng: "Hello các bạn lại là mình đây", kể suy nghĩ sai của chính mình trước khi giải thích. Emoji nhiều,
    hợp blog cá nhân, không hợp bài học.
41. **[lẫn]** Con chim xanh Duolingo và bài toán gửi 4 triệu notification trong 5s (editors' choice)
    https://viblo.asia/p/con-chim-xanh-duolingo-va-bai-toan-gui-4-trieu-notification-trong-5s-qPoL7RraJvk
    "Anh em nhìn các thông báo này có quen không", phép chia 800.000 noti mỗi giây, gấp 80 lần. Emoji và "đỉnh của chóp" dày, khối
    quảng cáo group chen vào.
42. **[lẫn]** Job Counting: Bài Toán Hóc Búa Mà Uber Giải Quyết "Trong Tích Tắc" (editors' choice)
    https://viblo.asia/p/job-counting-bai-toan-hoc-bua-ma-uber-giai-quyet-trong-tich-tac-018J2KDRLYK
    "bài toán khá khoai" là khẩu ngữ đúng chỗ; nhưng "Việc này đòi hỏi hệ thống phải có khả năng" là danh hóa.

## Đọc ra văn dịch, văn mẫu, quảng cáo (mẫu phản diện)

43. **[dịch/AI]** Khi Claude Code không tuân thủ quy tắc: cách xử lý bằng CLAUDE.md và harness
    https://viblo.asia/p/khi-claude-code-khong-tuan-thu-quy-tac-cach-xu-ly-bang-claudemd-va-harness-lZL9XYR7JQK
    Ngoặc giải nghĩa sau mọi thuật ngữ, "việc ghi lại các quy tắc sẽ hữu ích", "cần xem xét cả... lẫn...". Đọc như bản dịch máy.
44. **[dịch/AI]** Vì sao AI làm cùng một việc khác nhau mỗi lần khi lập trình với Claude Code?
    https://viblo.asia/p/vi-sao-ai-lam-cung-mot-viec-khac-nhau-moi-lan-khi-lap-trinh-voi-claude-code-nguyen-ly-llm-AWVpX52ZV05
    Ví dụ kimchi/jjigae lộ nguồn dịch, "Tác giả trong video phỏng đoán", câu nào cũng "bạn nên so sánh và kiểm tra".
45. **[dịch/AI]** Quản lý lỗ hổng bảo mật: kẻ tấn công không đọc điểm CVSS của bạn
    https://viblo.asia/p/quan-ly-lo-hong-bao-mat-ke-tan-cong-khong-doc-diem-cvss-cua-ban-AY4qQq5p4Pw
    Lập luận hay nhưng câu là tiếng Anh mặc áo Việt: "Anh ta" cho kẻ tấn công, "Chúng tiêu thụ bằng chứng khác nhau".
46. **[dịch/AI]** Phân biệt các tài liệu BRD vs SRS vs FRS
    https://viblo.asia/p/phan-biet-cac-tai-lieu-brd-vs-srs-vs-frs-XP4WE9bDL7G
    Tiêu đề viết hoa toàn bộ, "(Tạm dịch: Thông số kỹ thuật yêu cầu của phần mềm)", "được chi phối bởi các khung tiêu chuẩn".
47. **[dịch/AI]** Top Các Lỗ Hổng Bảo Mật (1) SQL Injection (editors' choice)
    https://viblo.asia/p/top-cac-lo-hong-bao-mat-1-sql-injection-aAY4q7jQLPw
    Khung văn mẫu: "Chào các bạn! Hôm nay chúng ta sẽ cùng tìm hiểu", "Tầm quan trọng của việc phòng chống", "dẫn đến nhiều hậu quả
    nghiêm trọng". Nội dung đúng, giọng không có người.
48. **[dịch/AI]** Vì sao mình viết lại type-tune từ TypeScript sang Rust? 🦀
    https://viblo.asia/p/vi-sao-minh-viet-lai-type-tune-tu-typescript-sang-rust-AY4qQqre4Pw
    Bản dịch từ tác giả Nhật: "Hoi hoi!", emoji mèo mỗi đoạn. Có một câu hay: "type-tune nhanh hơn. Developer của nó lại chậm hơn."
49. **[quảng cáo]** Chia sẻ kinh nghiệm xây dựng Chrome Extension thuyết minh tiếng Việt...
    https://viblo.asia/p/chia-se-kinh-nghiem-xay-dung-chrome-extension-thuyet-minh-tieng-viet-thoi-gian-thuc-02s-cho-youtube-coursera-udemy-pPLkN8XGJRZ
    "Chào mọi người trên Viblo", danh sách tính năng in đậm, "Miễn phí 30 phút mỗi ngày". Phần kỹ thuật chỉ lướt.
50. **[quảng cáo]** Tối ưu tốc độ khi mở nhiều môi trường trên laptop cấu hình trung bình
    https://viblo.asia/p/toi-uu-toc-do-khi-mo-nhieu-moi-truong-tren-laptop-cau-hinh-trung-binh-13VM9BvxVY7
    Mở bằng chuyện thật rất hay ("quạt kêu như máy sấy"), nhưng đoạn đầu đã cài tên sản phẩm. Học cách kể, đừng học mục đích.

## Đếm

- 50 bài đọc thân bài (không chỉ tiêu đề); 6 bài đọc thêm đoạn kết để xem cách đóng bài (1, 2, 5, 10, 24, 33).
- 31 bài [tự nhiên], 11 bài [lẫn], 6 bài [dịch/AI], 2 bài [quảng cáo].
- Loại: 9 debug/postmortem/đo đạc, 14 giải thích/series, 13 hướng dẫn công cụ, 3 chi phí AWS, 3 phỏng vấn/system design, 8 mẫu phản diện.
