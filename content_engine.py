#!/usr/bin/env python3
"""Local semantic search and topic planning for Qiuqiu's content archive."""
from __future__ import annotations

import argparse
import hashlib
import math
import os
import re
from pathlib import Path
from urllib.parse import quote

import chromadb
import yaml

VAULT = Path(__file__).resolve().parents[2]
ARCHIVE = Path(__file__).resolve().parent / "content" / "公众号"
DATA = Path(__file__).resolve().parent / "data"
COLLECTION = "qiuqiu-wechat"


def client():
    DATA.mkdir(exist_ok=True)
    return chromadb.PersistentClient(path=str(DATA / "chroma"))


def collection():
    return client().get_or_create_collection(
        name=COLLECTION,
        metadata={"description": "秋秋历史公众号文章语义索引"},
    )


def vector(text: str, dimensions: int = 768):
    """Small local Chinese-friendly hashed n-gram vector."""
    text = re.sub(r"\s+", "", text.lower())
    features = {}
    for n in (1, 2, 3):
        for i in range(max(0, len(text) - n + 1)):
            gram = text[i : i + n]
            if n == 1 and not re.search(r"[\u4e00-\u9fffA-Za-z0-9]", gram):
                continue
            key = int(hashlib.md5(gram.encode("utf-8")).hexdigest(), 16) % dimensions
            features[key] = features.get(key, 0.0) + (1.0 if n == 2 else 0.5)
    norm = math.sqrt(sum(v * v for v in features.values())) or 1.0
    out = [0.0] * dimensions
    for key, value in features.items():
        out[key] = value / norm
    return out


def parse_note(path: Path):
    text = path.read_text(encoding="utf-8", errors="ignore")
    meta = {}
    body = text
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end >= 0:
            raw_meta = text[4:end]
            try:
                meta = yaml.safe_load(raw_meta) or {}
            except yaml.YAMLError:
                meta = _fallback_meta(raw_meta)
            body = text[end + 5 :]
    title = str(meta.get("name") or _h1(body) or path.stem)
    description = str(meta.get("description") or "")
    tags = meta.get("tags") or []
    if isinstance(tags, str):
        tags = [tags]
    published = str(meta.get("published") or "")
    searchable = "\n".join([title, description, " ".join(map(str, tags)), body])
    return {
        "title": title,
        "description": description,
        "tags": [str(x) for x in tags],
        "published": published,
        "path": str(path.relative_to(VAULT)),
        "absolute_path": str(path),
        "text": searchable,
    }


def _fallback_meta(raw: str):
    """Read the simple frontmatter fields used in this vault when YAML is lenient."""
    meta = {}
    for key in ("name", "description", "source", "published"):
        m = re.search(rf"^{key}:\s*[\"]?(.*?)[\"]?\s*$", raw, re.M)
        if m:
            meta[key] = m.group(1).replace('\\[', '[').replace('\\]', ']')
    m = re.search(r"^tags:\s*\[(.*?)\]\s*$", raw, re.M)
    if m:
        meta["tags"] = re.findall(r"[\"']([^\"']+)[\"']|([^,\s]+)", m.group(1))
        meta["tags"] = [a or b for a, b in meta["tags"]]
    return meta


def _h1(body):
    m = re.search(r"^#\s+(.+?)\s*$", body, re.M)
    return m.group(1).strip() if m else ""


def obsidian_link(path: str):
    return f"obsidian://open?path={quote(str((VAULT / path).resolve()))}"


def index():
    notes = [parse_note(p) for p in sorted(ARCHIVE.rglob("*.md"))]
    try:
        client().delete_collection(COLLECTION)
    except Exception:
        pass
    col = collection()
    if notes:
        col.upsert(
            ids=[n["path"] for n in notes],
            documents=[n["text"] for n in notes],
            embeddings=[vector(n["text"]) for n in notes],
            metadatas=[{k: n[k] for k in ("title", "description", "published", "path", "absolute_path")} for n in notes],
        )
    print(f"已索引 {len(notes)} 篇文章，向量库：{DATA / 'chroma'}")


def search(query: str, limit: int = 8):
    result = collection().query(query_embeddings=[vector(query)], n_results=limit)
    docs = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    if not docs:
        print("没有找到匹配文章。请先运行 index。")
        return []
    for i, (meta, distance) in enumerate(zip(docs, distances), 1):
        print(f"{i}. [{meta['title']}]({obsidian_link(meta['path'])})")
        print(f"   {meta.get('published','')} · 距离 {distance:.3f}")
        if meta.get("description"):
            print(f"   {meta['description']}")
    return docs


def suggest(topic: str, limit: int = 5):
    print(f"# 秋秋选题助手：{topic}\n")
    docs = collection().query(query_embeddings=[vector(topic)], n_results=limit).get("metadatas", [[]])[0]
    print("## 历史内容参考\n")
    for meta in docs:
        print(f"- [{meta['title']}]({obsidian_link(meta['path'])})：{meta.get('description','')}")
    print("\n## 新选题方向\n")
    print(f"- 公众号文章：{topic}｜普通人实测、具体数字与可执行方法")
    print(f"- 竖版视频：3 个关于“{topic}”的结果/误区，前 3 秒先给结论")
    print(f"- 横版视频：完整拆解“{topic}”，加入过程、案例和复盘")
    print("\n## 建议排期\n")
    print("- 周一：确定选题与资料，完成公众号文章提纲")
    print("- 周二：完成公众号文章初稿")
    print("- 周三：拍摄并剪辑 1 条竖版视频")
    print("- 周四：发布公众号文章")
    print("- 周五：剪辑横版视频并发布视频号/B 站")
    print("- 周末：复盘数据，记录可继续发展的子选题")


def main():
    parser = argparse.ArgumentParser(description="qiuqiu-content-engine")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("index", help="建立或更新本地向量索引")
    s = sub.add_parser("search", help="搜索历史公众号文章")
    s.add_argument("query")
    s.add_argument("-n", "--limit", type=int, default=8)
    a = sub.add_parser("suggest", help="根据历史内容生成选题与排期建议")
    a.add_argument("topic")
    a.add_argument("-n", "--limit", type=int, default=5)
    args = parser.parse_args()
    {"index": index, "search": lambda: search(args.query, args.limit), "suggest": lambda: suggest(args.topic, args.limit)}[args.command]()


if __name__ == "__main__":
    main()
