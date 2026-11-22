# Rules: Bản chất

Part 2 is written like an engineering blog post: it leads the reader through the opener's scenario, one mechanism at a time (the
symptom, why it happens, the mechanism that fixes it, the code), with real code the reader can copy, paste and run at home, and it closes
with a **"Mang về"** checklist: the few things to apply in their own system. Prose carries the reader from one mechanism to the next; a
section is never a bare list of facts.

## The template

The owner's lesson template (`sections/2-essence/vi.md` and `en.md`) stays the skeleton the post is written in, in this order
**(đề xuất: the blog voice fills the template; the "Mang về" checklist closes part 3 Tổng kết)**:

1. **Lời mở đầu**: a Senior/Mid dialogue, then "a correct flow must do N things", then what 2.1 and 2.2 cover.
2. **Các khái niệm cốt lõi**:
   - **2.1 Thực hành**: 2.1.1 source and clone; 2.1.2 architecture (a component, file and role table, a mermaid figure with its
     "Hình N:" caption); 2.1.3 code explanation (snippets with `// WHY` comments, each paragraph ending "Bản chất: …"); 2.1.4
     prerequisites and run; 2.1.5 test flows ("Luồng N": the command, the expected output, an italic "*Kết luận: …*"); 2.1.6 cleanup;
     2.1.7 further reading (real links); 2.1.8 asking AI through the lesson's MCP (its config and four sample questions).
   - **2.2 Lý thuyết**: 2.2.1 Bản chất (one bold sentence, then bullets "Vì sao quan trọng … Verify ở Luồng N"); 2.2.2 edge cases, each
     "**X:** the problem. **Giải pháp:** …".
3. **Tổng kết**: 3.1 interview questions, each with "Ý interviewer muốn nghe" and "Trả lời mẫu (ngắn)".

## The source

The source is one TypeScript program run directly by Node 24, with no library beyond Express and the unavoidable database drivers
(owner 2026-11-22: "code chạy không cài lib"): everything the part explains is written by hand and readable.
