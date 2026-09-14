#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批量提取公众号文章元数据和正文内容，输出 JSON 供后续分析。

v2: 读入 config/taxonomy.json，用 aliases 自动给每篇打【内容支柱 pillar】和【内容类型 content_type】标签
    （读取时动态判断，不改动原始 md 文件）。统计增加 pillar / 类型的分布。
"""
import os
import re
import json
import glob
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
TAXONOMY_PATH = os.path.join(ROOT, "config", "taxonomy.json")


def load_taxonomy():
    """读取 config/taxonomy.json 内容地图，返回 (pillars, content_types)。"""
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        tax = json.load(f)
    return tax.get("pillars", []), tax.get("content_types", [])


def classify_by_alias(items, haystack):
    """用各 item.aliases 在 haystack 中匹配，返回命中的 id 列表。"""
    hits = []
    for item in items:
        for alias in item.get("aliases", []):
            if alias and alias.lower() in haystack.lower():
                hits.append(item["id"])
                break
    return hits


def parse_front_matter(text):
    """解析 YAML front matter。"""
    meta = {}
    if not text.startswith("---"):
        return meta, text
    end = text.find("---", 3)
    if end == -1:
        return meta, text
    fm = text[3:end].strip()
    body = text[end+3:].strip()
    for line in fm.split("\n"):
        line = line.strip()
        if ":" in line:
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key == "tags":
                # 提取 tags 数组
                tags = re.findall(r'"([^"]*)"', val)
                if not tags:
                    tags = re.findall(r"'([^']*)'", val)
                meta[key] = tags
            elif key == "category":
                meta[key] = val
            else:
                meta[key] = val
    return meta, body


def clean_body(body):
    """清理正文，去除图片、链接、格式标记，返回纯文本。"""
    text = re.sub(r'!\[.*?\]\(.*?\)', '', body)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'\[([^\[\]]*)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'_+', '', text)
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^[-*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_date_from_filename(filename):
    """从文件名提取日期，如 20230202 -> 2023-02-02。"""
    m = re.match(r'(\d{8})', filename)
    if m:
        try:
            return datetime.strptime(m.group(1), "%Y%m%d").strftime("%Y-%m-%d")
        except Exception:
            pass
    return None


def process_file(filepath, account_name, pillars, content_types):
    """处理单篇文章。"""
    filename = os.path.basename(filepath)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            raw = f.read()
    except Exception as e:
        print(f"读取失败 {filename}: {e}")
        return None

    meta, body = parse_front_matter(raw)
    clean_text = clean_body(body)
    word_count = len(re.sub(r'\s', '', clean_text))

    # 标题优先用 front matter 的 name，否则用文件名
    title = meta.get("name", "") or (re.sub(r'\.md$', '', re.sub(r'^\d{8}-', '', filename)))
    date = meta.get("published", "") or extract_date_from_filename(filename)
    description = meta.get("description", "")
    tags = meta.get("tags", [])
    source = meta.get("source", "")

    # 用 taxonomy 别名自动打标（不改原文件）
    haystack = " ".join([title, description, " ".join(map(str, tags))])
    pillars_hit = classify_by_alias(pillars, haystack)
    types_hit = classify_by_alias(content_types, haystack)

    return {
        "filename": filename,
        "account": account_name,
        "title": title,
        "date": date,
        "description": description,
        "tags": tags,
        "source": source,
        "word_count": word_count,
        "pillars": pillars_hit,      # 自动识别的内容支柱（财务自由/生活方式/...）
        "content_type": types_hit,    # 自动识别的内容类型（知识/经验/故事/...）
        "content_preview": clean_text[:500],
        "content_full": clean_text,
    }


def main():
    pillars, content_types = load_taxonomy()
    pillar_name = {p["id"]: p["name"] for p in pillars}
    type_name = {t["id"]: t["name"] for t in content_types}

    all_articles = []
    for folder in ["《秋秋很开心》", "《秋秋在分享》"]:
        folder_path = os.path.join(BASE_DIR, folder)
        account_name = folder.strip("《》")
        files = glob.glob(os.path.join(folder_path, "*.md"))
        print(f"处理 {account_name}: {len(files)} 篇")
        for fp in sorted(files):
            article = process_file(fp, account_name, pillars, content_types)
            if article:
                all_articles.append(article)

    # 按日期排序
    all_articles.sort(key=lambda x: x.get("date") or "0000-00-00")

    # 输出完整 JSON
    output_dir = os.path.join(BASE_DIR, "outputs")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "articles_data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)

    # 输出统计摘要
    print(f"\n=== 统计摘要 ===")
    print(f"总文章数: {len(all_articles)}")
    dates = [a["date"] for a in all_articles if a["date"]]
    if dates:
        print(f"时间范围: {min(dates)} ~ {max(dates)}")
    total_words = sum(a["word_count"] for a in all_articles)
    print(f"总字数: {total_words:,}")
    print(f"平均字数: {total_words // len(all_articles):,}")

    # 按公众号统计
    for acc in ["秋秋很开心", "秋秋在分享"]:
        sub = [a for a in all_articles if a["account"] == acc]
        print(f"  {acc}: {len(sub)} 篇, {sum(a['word_count'] for a in sub):,} 字")

    # ---- 新增: pillar 分布 ----
    from collections import Counter
    p_counter = Counter()
    t_counter = Counter()
    for a in all_articles:
        for p in a["pillars"]:
            p_counter[p] += 1
        for t in a["content_type"]:
            t_counter[t] += 1

    if p_counter:
        print("\n=== Pillar 分布 ===")
        for pid, cnt in p_counter.most_common():
            print(f"  {pillar_name.get(pid, pid)}: {cnt} 篇")
    if t_counter:
        print("\n=== 内容类型分布 ===")
        for tid, cnt in t_counter.most_common():
            print(f"  {type_name.get(tid, tid)}: {cnt} 篇")

    print(f"\n数据已保存到: {output_path}")


if __name__ == "__main__":
    main()