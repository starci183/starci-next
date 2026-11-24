# Audience

The reader is a developer, the language is Vietnamese with English terms, and the lesson teaches one concept.

StarCi Next declares `audience: technical` (harness `contexts/ui/content.md` CONTENT-2): technical terms are allowed, and each finding
is led by the human sentence, the code after it. Right: "Deploy chờ database rồi bỏ cuộc sau 60 giây", then the exit code and the log
line. Wrong: the log line alone.

Technical terms stay English (cache-aside, TTL, outbox, retry, single-flight), each with a short Vietnamese gloss on its first use in a
lesson: "single-flight (nhiều request cùng hỏi một key thì chỉ một request xuống database)" **(đề xuất)** (the gloss says what the term
does, in the words a developer uses; the earlier gloss leaned on the calque "lượt đọc", see [voice.md](voice.md) §3.2). After that, the term alone. The sentence around them is
Vietnamese.
