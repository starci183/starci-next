"""Copy the named Academy input bytes; never write to the Academy source.

Run with --verify to check the committed snapshot without the source checkout.
Run with --verify-source to additionally compare the read-only Academy files.
Capture is explicit (--capture); an existing version is verified, never overwritten.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE_REPO = Path("D:/Repositories/starci-lab-data")
LESSON = "courses/0-fullstack-mastery/modules/2-rest-api-design-and-documentation/contents/0-restful-api-crud-best-practices"
SOURCE = SOURCE_REPO / LESSON
VARIANTS = {"typescript": "0-typescript", "java": "1-java", "csharp": "2-csharp", "go": "3-go"}
LOCALES = ["en", "vi"]
SEP = b"<!-- @starci/seperator -->"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def article_index(data):
    marker = re.search(rb"(?m)^# body\r?\n" + re.escape(SEP) + rb"\r?\n", data)
    assert marker, "missing Academy body field"
    start = marker.end()
    end = data.index(SEP, start)
    article = data[start:end]
    headings, protected, questions = [], [], []
    offset, fence = start, None
    for line in article.splitlines(keepends=True):
        stripped = line.strip()
        fm = re.match(rb"(`{3,}|~{3,})", stripped)
        if fm:
            if fence is None:
                fence = fm.group(1)[:1]
            elif fm.group(1)[:1] == fence:
                fence = None
        elif fence is None:
            heading = re.match(rb"^(#{2,6}) (.+?)(?:\r?\n)?$", line)
            if heading:
                number = re.match(rb"(\d+(?:\.\d+)*)\.\s", heading[2])
                assert number, "review changed heading identity before capture"
                headings.append({"id": "section-" + number[1].decode("ascii"), "depth": len(heading[1]), "text": heading[2].decode("utf-8"), "start": offset, "end": offset + len(line)})
            if stripped.startswith((b"- **Question ", "- **Câu hỏi ".encode())):
                questions.append({"id": "interview-" + str(len(questions) + 1), "promptStart": offset, "promptEnd": offset + len(line), "protectedRanges": []})
            if stripped.startswith((b"- What the interviewer wants to hear:", b"- What interviewers want to hear:", b"- Sample answer (", "- Ý interviewer muốn nghe:".encode(), "- Trả lời mẫu (ngắn):".encode())):
                span = {"start": offset, "end": offset + len(line), "kind": "interviewerPoints" if b"interviewer" in stripped else "sampleAnswer"}
                protected.append(span)
                assert questions, "protected material without interview question"
                questions[-1]["protectedRanges"].append(span)
        offset += len(line)
    assert len(questions) == 3 and len(protected) == 6, "review changed interview structure before capture"
    section1end = next(h["start"] for h in headings[1:] if h["depth"] == 2)
    public = []
    cursor = start
    for span in protected:
        if cursor < span["start"]:
            public.append({"start": cursor, "end": span["start"]})
        cursor = span["end"]
    if cursor < end:
        public.append({"start": cursor, "end": end})
    return {"offsetUnit": "zero-based UTF-8 bytes; end exclusive in raw file", "article": {"start": start, "end": end, "sha256": sha(article)}, "section1": {"start": start, "end": section1end, "sha256": sha(data[start:section1end])}, "outline": headings, "protectedRanges": protected, "interviewQuestions": questions, "publicArticleRanges": public}


def capture():
    if (ROOT / "manifest.json").exists():
        verify(compare_source=True)
        print("Existing immutable fixture retained; changed source requires a new fixture version.")
        return
    files = [Path(locale + ".md") for locale in LOCALES]
    files += [Path("bodies") / variant / (locale + ".md") for variant in VARIANTS.values() for locale in LOCALES]
    files += sorted((p.relative_to(SOURCE) for p in (SOURCE / "challenges").rglob("*.md")))
    revision = subprocess.check_output(["git", "-C", str(SOURCE_REPO), "rev-parse", "HEAD"], text=True).strip()
    dirty = subprocess.check_output(["git", "-C", str(SOURCE_REPO), "status", "--porcelain", "--", LESSON], text=True).splitlines()
    entries, variants = [], []
    for relative in files:
        source = SOURCE / relative
        data = source.read_bytes()
        copied = ROOT / "original" / relative
        copied.parent.mkdir(parents=True, exist_ok=True)
        copied.write_bytes(data)
        entries.append({"sourcePath": source.as_posix(), "fixturePath": copied.relative_to(ROOT).as_posix(), "bytes": len(data), "sha256": sha(data), "classification": "server-only raw input; project through data.lessons.content"})
    for language, directory in VARIANTS.items():
        for locale in LOCALES:
            copied = ROOT / "original/bodies" / directory / (locale + ".md")
            variants.append({"programmingLanguage": language, "locale": locale, "fixturePath": copied.relative_to(ROOT).as_posix(), **article_index(copied.read_bytes())})
    manifest = {"schema": "lessons.fixture-provenance@1", "id": "fixture.lessons.academy-rest-semantics.v1", "version": "1.0.0", "capturedAt": "2026-10-28", "sourceReadOnly": True, "sourceRoot": SOURCE.as_posix(), "sourceRepository": SOURCE_REPO.as_posix(), "gitRevision": revision, "sourceDirtyPaths": dirty, "programmingLanguages": list(VARIANTS), "locales": LOCALES, "files": entries, "articles": variants}
    (ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def verify(compare_source=False):
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["sourceReadOnly"] is True
    assert len(manifest["files"]) == 26 and len(manifest["articles"]) == 8
    for entry in manifest["files"]:
        data = (ROOT / entry["fixturePath"]).read_bytes()
        assert sha(data) == entry["sha256"] and len(data) == entry["bytes"], entry["fixturePath"]
        if compare_source:
            assert Path(entry["sourcePath"]).read_bytes() == data, entry["sourcePath"]
    for variant in manifest["articles"]:
        data = (ROOT / variant["fixturePath"]).read_bytes()
        assert article_index(data) == {k: v for k, v in variant.items() if k not in ("programmingLanguage", "locale", "fixturePath")}
        assert b"```mermaid" in data
        for protected in variant["protectedRanges"]:
            assert not any(p["start"] < protected["end"] and protected["start"] < p["end"] for p in variant["publicArticleRanges"])
    print("PASS: 26 byte-exact source files, 8 language/locale articles, exact section-1/outline indexes and 48 withheld grading spans")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--capture", action="store_true")
    action.add_argument("--verify", action="store_true")
    action.add_argument("--verify-source", action="store_true")
    args = parser.parse_args()
    if args.capture:
        capture()
    else:
        verify(args.verify_source)
