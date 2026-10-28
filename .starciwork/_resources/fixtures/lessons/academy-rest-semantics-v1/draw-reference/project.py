"""Build or verify static drawing inputs; never modify either source checkout.

python -X utf8 <this-file> --write   # explicit snapshot refresh
python -X utf8 <this-file> --verify  # verify committed fixture and frozen snapshot

Only --write reads the two named commerce files. Verification is offline and
does not treat commerce design records as proof of deployed behavior.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIXTURE = HERE.parent
COMMERCE = Path("D:/.claude/.runtime/projects/starci-next-app-cff4885ec1/worktrees/subscription-premium")
COMMERCE_PATHS = [
    ".starciwork/features/commerce/contract/entitlement/index.yaml",
    ".starciwork/features/commerce/ui/plans/index.yaml",
]
CHALLENGES = [
    "0-restful-api-crud-best-practices-easy",
    "1-pagination-filtering-rest-api-medium",
    "2-batch-operations-with-transaction-hard",
    "3-idempotent-csv-import-insane",
]
SEP = b"<!-- @starci/seperator -->"
SCOPE = (
    "Static projection of the committed test fixture for lesson drawings only. "
    "This is not the production content API and does not authorize client access. "
    "Programming language typescript and locale vi are independent selections."
)
CLASSIFICATION = [
    "The complete requirement title/body fields, including their original hints, "
    "are public under data.lessons.content; they are copied without rewriting.",
    "The source steps are guided solution material and are excluded in full. "
    "Outputs are outside the public allowlist and are excluded; score and verified "
    "fields are excluded at every level. No submissions are read or projected.",
    "No unresolved field classification remains for this selected variant. "
    "Unknown fields or a changed field structure stop projection for review.",
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def source_range(start, end, data):
    return {"start": start, "end": end, "sha256": sha(data[start:end])}


def fields(data):
    """Index Academy wrapper fields in raw UTF-8 bytes, preserving CRLF values.

    This is deliberately a strict parser for the four named fixture definitions,
    not a production Academy parser or generic Markdown exposure mechanism.
    """
    stack, values = [], {}
    marker = re.compile(rb"(?m)^(#{1,5}) ([^\r\n]+)\r?\n")
    pos = 0
    while pos < len(data):
        if not data[pos:].strip():
            break
        match = marker.match(data, pos)
        assert match, f"unexpected field boundary at byte {pos}"
        depth, name = len(match[1]), match[2].decode("ascii")
        assert depth <= len(stack) + 1, "skipped structural depth"
        stack = stack[:depth - 1] + [name]
        pos = match.end()
        if data.startswith(SEP, pos):
            assert data[pos + len(SEP):].startswith(b"\r\n"), "changed wrapper newline"
            start = pos + len(SEP) + 2
            end = data.index(SEP, start)
            assert end >= 2 and data[end - 2:end] == b"\r\n"
            key = tuple(stack)
            assert key not in values, "duplicate field"
            values[key] = (start, end)
            pos = end + len(SEP)
            assert data[pos:pos + 2] == b"\r\n"
            pos += 2
    return values


def lesson_projection():
    manifest_bytes = (FIXTURE / "manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    selected = next(a for a in manifest["articles"] if (a["programmingLanguage"], a["locale"]) == ("typescript", "vi"))
    body = (FIXTURE / selected["fixturePath"]).read_bytes()
    entry = next(f for f in manifest["files"] if f["fixturePath"] == selected["fixturePath"])
    assert sha(body) == entry["sha256"] and len(body) == entry["bytes"]
    article = b"".join(body[r["start"]:r["end"]] for r in selected["publicArticleRanges"])
    section = body[selected["section1"]["start"]:selected["section1"]["end"]]
    assert sha(section) == selected["section1"]["sha256"]
    prompts = [{"id": q["id"], "prompt": body[q["promptStart"]:q["promptEnd"]].decode("utf-8"),
                "sourceRange": source_range(q["promptStart"], q["promptEnd"], body)} for q in selected["interviewQuestions"]]
    definitions, challenge_proofs, withheld = [], [], []
    for cid in CHALLENGES:
        path = f"original/challenges/{cid}/vi.md"
        data = (FIXTURE / path).read_bytes()
        item = next(f for f in manifest["files"] if f["fixturePath"] == path)
        assert sha(data) == item["sha256"] and len(data) == item["bytes"]
        indexed = fields(data)
        assert {k[0] for k in indexed} == {"sortIndex", "title", "description", "requirements", "steps", "outputs", "prerequisites", "difficulty", "score", "verified"}
        expected = {(n,) for n in ("sortIndex", "title", "description", "difficulty", "score", "verified")}
        for group in ("requirements", "steps", "outputs", "prerequisites"):
            indexes = sorted({int(k[1]) for k in indexed if k[0] == group})
            assert indexes == list(range(len(indexes)))
            for index in indexes:
                for language_index, language in enumerate(("typescript", "java", "csharp", "go")):
                    prefix = (group, str(index), "langs", str(language_index))
                    leaves = ("lang", "title", "body", "score") if group == "requirements" else (("lang", "title", "body") if group == "steps" else ("lang", "text"))
                    expected.update(prefix + (leaf,) for leaf in leaves)
                    a, b = indexed[prefix + ("lang",)]
                    assert data[a:b] == language.encode() + b"\r\n"
        assert set(indexed) == expected, "review unknown source fields"
        public_ranges = []

        def copy(key):
            start, end = indexed[key]
            public_ranges.append({"field": ".".join(key), **source_range(start, end, data)})
            return data[start:end].decode("utf-8")

        definition = {"id": cid, "locale": "vi", "programmingLanguage": "typescript",
                      "title": copy(("title",)), "description": copy(("description",)),
                      "difficulty": copy(("difficulty",)), "requirements": [], "prerequisites": []}
        for index in sorted({int(k[1]) for k in indexed if k[0] == "requirements"}):
            prefix = ("requirements", str(index), "langs", "0")
            definition["requirements"].append({"id": f"requirement-{index}", "title": copy(prefix + ("title",)), "body": copy(prefix + ("body",))})
        for index in sorted({int(k[1]) for k in indexed if k[0] == "prerequisites"}):
            definition["prerequisites"].append({"id": f"prerequisite-{index}", "text": copy(("prerequisites", str(index), "langs", "0", "text"))})
        protected = [{"field": ".".join(k), **source_range(a, b, data)} for k, (a, b) in indexed.items() if k[0] == "steps" or k[-1] in ("score", "verified")]
        for span in protected:
            assert not any(p["start"] < span["end"] and span["start"] < p["end"] for p in public_ranges)
            # A byte-exact protected field may share short words with public prose;
            # whole solution fields must never be copied, regardless of wording.
            if span["field"].startswith("steps.") and span["field"].endswith((".title", ".body")):
                assert data[span["start"]:span["end"]] not in article
        definition["source"] = {"fixturePath": path, "sha256": sha(data), "publicFieldRanges": public_ranges}
        definitions.append(definition)
        challenge_proofs.append({"id": cid, "fixturePath": path, "sha256": sha(data), "publicFieldByteEquality": True,
                                 "requirementCount": len(definition["requirements"]), "prerequisiteCount": len(definition["prerequisites"]),
                                 "publicFieldRanges": public_ranges, "excludedFieldRanges": protected,
                                 "submissionsReadOrIncluded": False})
        withheld.extend((path, span, data[span["start"]:span["end"]]) for span in protected
                        if span["field"].startswith("steps.") and span["field"].endswith((".title", ".body")))
    reference = {"schema": "lesson-draw-reference@1", "sourceManifestSha256": sha(manifest_bytes),
                 "programmingLanguage": "typescript", "locale": "vi", "scope": SCOPE,
                 "sourceValueEncoding": "Every copied field retains its exact UTF-8 value bytes, including source CRLF terminators between Academy wrapper separators; no trim or newline normalization is applied.",
                 "sourceFixtureId": manifest["id"], "sourceArticlePath": selected["fixturePath"],
                 "publicArticle": article.decode("utf-8"), "section1": section.decode("utf-8"),
                 "outline": selected["outline"], "interviewPrompts": prompts, "challengeDefinitions": definitions,
                 "classificationNotes": CLASSIFICATION}
    strings = list(all_strings(reference))
    exclusions = []
    for span in selected["protectedRanges"]:
        assert not any(r["start"] < span["end"] and span["start"] < r["end"] for r in selected["publicArticleRanges"])
        protected_text = body[span["start"]:span["end"]].decode("utf-8")
        assert not any(protected_text in s for s in strings), "interview material leaked"
        exclusions.append({**span, "sha256": sha(body[span["start"]:span["end"]]), "publicOverlapBytes": 0, "presentInReference": False})
    for path, span, text in withheld:
        assert not any(text.decode("utf-8") in s for s in strings), f"guided solution leaked: {path} {span['field']}"
    assert len(prompts) == 3 and len(definitions) == 4
    assert len({p["id"] for p in prompts}) == 3 and len({d["id"] for d in definitions}) == 4
    assert b"```mermaid\r\n" in article and b"```typescript\r\n" in article
    proof = {"sourceManifestSha256": sha(manifest_bytes), "sourceBodySha256": sha(body),
             "sourceFixtureId": manifest["id"], "variant": {"programmingLanguage": "typescript", "locale": "vi"},
             "publicArticle": {"byteEqual": True, "bytes": len(article), "sha256": sha(article), "sourceRanges": selected["publicArticleRanges"]},
             "section1": {"byteEqual": True, "bytes": len(section), **selected["section1"]},
             "outline": {"equal": True, "count": len(selected["outline"]), "complete": True},
             "interviewPrompts": {"count": len(prompts), "byteEqual": True, "items": [{"id": p["id"], **p["sourceRange"]} for p in prompts]},
             "challengeDefinitions": {"count": len(definitions), "items": challenge_proofs},
             "protectedSpanExclusion": {"interviewSpans": exclusions, "challengeGuidedSolutionFieldsChecked": len(withheld),
                                        "allPublicFieldRangesDisjoint": True, "protectedFieldContentPresent": False,
                                        "method": "Explicit public-field allowlist, byte-range non-overlap, whole protected interview and guided-solution field absence across every reference string; no raw submissions are read. Short shared words and numeric score values are not treated as uniquely protected strings."},
             "sourceCodeAndMermaidPreserved": True, "classificationAmbiguity": CLASSIFICATION}
    return reference, proof


def all_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from all_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from all_strings(item)


def yaml_field(text, name):
    match = re.search(rf"(?m)^{name}: ?(.*)(?:\r?\n|$)", text)
    assert match, name
    return match[1].rstrip("\r")


def yaml_block(text, name):
    match = re.search(rf"(?m)^{name}:\r?\n((?:[ \t].*(?:\r?\n|$))+)", text)
    assert match, name
    return match[0]


def yaml_list(text, name):
    block = yaml_block(text, name).splitlines()[1:]
    items = []
    for line in block:
        if line.startswith("  - "):
            items.append(line[4:])
        else:
            assert line.startswith("    ") and items
            items[-1] += " " + line.strip()
    return items


def commerce_snapshot():
    revision = subprocess.check_output(["git", "-C", str(COMMERCE), "rev-parse", "HEAD"], text=True).strip()
    sources = []
    for relative in COMMERCE_PATHS:
        path = COMMERCE / relative
        data = path.read_bytes()
        status = subprocess.check_output(["git", "-C", str(COMMERCE), "status", "--porcelain", "--", relative], text=True).splitlines()
        committed = subprocess.check_output(["git", "-C", str(COMMERCE), "show", f"{revision}:{relative}"])
        sources.append({"absolutePath": path.as_posix(), "gitRevision": revision, "sha256": sha(data), "bytes": len(data),
                        "committedFileSha256": sha(committed), "matchesCommittedBytes": data == committed,
                        "matchesCommitAfterCrLfNormalization": data.replace(b"\r\n", b"\n") == committed.replace(b"\r\n", b"\n"),
                        "sourceDirtyPaths": status, "text": data.decode("utf-8")})
    contract, plans = sources[0]["text"], sources[1]["text"]
    assert yaml_field(contract, "id") == "contract.commerce.entitlement"
    assert yaml_field(plans, "id") == "ui.commerce.plans" and yaml_field(plans, "route") == "/premium"
    return {"schema": "lesson-draw-commerce-reference@1", "sourcePaths": [s["absolutePath"] for s in sources],
            "sources": sources,
            "entitlementContract": {"id": yaml_field(contract, "id"), "text": contract,
                                    "state": yaml_field(contract, "state"), "activity": yaml_field(contract, "activity"),
                                    "surface": yaml_list(contract, "surface"), "surfaceText": yaml_block(contract, "surface"),
                                    "guarantees": yaml_list(contract, "guarantees"), "guaranteesText": yaml_block(contract, "guarantees"),
                                    "consumerObligations": yaml_list(contract, "consumerObligations"),
                                    "requiresProofText": yaml_block(contract, "requiresProof")},
            "plansRoute": {"id": yaml_field(plans, "id"), "route": yaml_field(plans, "route"), "text": plans,
                           "state": yaml_field(plans, "state"), "activity": yaml_field(plans, "activity"),
                           "direction": yaml_field(plans, "direction"), "ui": yaml_list(plans, "ui")},
            "scope": "Traceable read-only drawing-reference snapshot. The source Work records remain authoritative; this snapshot defines no new commerce contract and proves neither a merged commerce runtime nor successful entitlement tests. Both source records are todo and the plans direction is pending. The active-renewal guarantee remains proposed in Q-W2-5 as written. No checkout or provider configuration is supplied or inferred.",
            "provenanceNote": "The exact source checkout bytes are retained in text and identified by sha256. committedFileSha256 identifies the Git blob at gitRevision separately; clean Windows checkout CRLF conversion can make those hashes differ. matchesCommitAfterCrLfNormalization records whether that is the only difference."}


def verify_commerce(snapshot):
    assert snapshot["sourcePaths"] == [(COMMERCE / p).as_posix() for p in COMMERCE_PATHS]
    assert len(snapshot["sources"]) == 2
    for path, source in zip(snapshot["sourcePaths"], snapshot["sources"]):
        data = source["text"].encode("utf-8")
        assert source["absolutePath"] == path
        assert sha(data) == source["sha256"] and len(data) == source["bytes"]
        assert re.fullmatch(r"[0-9a-f]{40}", source["gitRevision"])
        assert source["sourceDirtyPaths"] == []
        assert source["matchesCommittedBytes"] == (source["sha256"] == source["committedFileSha256"])
        assert source["matchesCommitAfterCrLfNormalization"] is True
    contract, plans = (s["text"] for s in snapshot["sources"])
    c, p = snapshot["entitlementContract"], snapshot["plansRoute"]
    assert c["text"] == contract and p["text"] == plans
    for obj, source in ((c, contract), (p, plans)):
        for key in ("id", "state", "activity"):
            assert obj[key] == yaml_field(source, key)
    assert c["id"] == "contract.commerce.entitlement" and p["id"] == "ui.commerce.plans"
    for key in ("surface", "guarantees", "consumerObligations"):
        assert c[key] == yaml_list(contract, key)
    for key in ("surface", "guarantees", "requiresProof"):
        assert c[key + "Text"] == yaml_block(contract, key)
    assert p["route"] == yaml_field(plans, "route") == "/premium"
    assert p["direction"] == yaml_field(plans, "direction") and p["ui"] == yaml_list(plans, "ui")
    assert c["state"] == p["state"] == "todo"


def verify():
    expected, proof = lesson_projection()
    actual = json.loads((HERE / "reference.json").read_bytes())
    assert actual == expected, "drawing reference differs from exact public projection"
    commerce = json.loads((HERE / "commerce-reference.json").read_bytes())
    verify_commerce(commerce)
    proof["commerceSnapshot"] = {"canonicalContractId": commerce["entitlementContract"]["id"],
                                 "plansScreenId": commerce["plansRoute"]["id"], "plansRoute": commerce["plansRoute"]["route"],
                                 "sources": [{k: s[k] for k in ("absolutePath", "gitRevision", "sha256", "bytes", "committedFileSha256", "matchesCommittedBytes", "matchesCommitAfterCrLfNormalization", "sourceDirtyPaths")} for s in commerce["sources"]],
                                 "exactSourceTextAndGuarantees": True, "sourceState": "todo", "runtimeProven": False,
                                 "verificationScope": "Frozen snapshot hashes, exact embedded text and extracted fields; current commerce checkout is not needed for offline verification."}
    write_json(HERE / "projection-proof.json", proof)
    print("PASS: exact typescript/vi article, section1, 20 outline entries, 3 prompts, 4 public challenges; protected fields excluded; traceable todo commerce snapshot at /premium")
    return proof


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.write:
        reference, _ = lesson_projection()
        commerce = commerce_snapshot()
        verify_commerce(commerce)
        write_json(HERE / "reference.json", reference)
        write_json(HERE / "commerce-reference.json", commerce)
    verify()
