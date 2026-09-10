#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批量提取公众号文章元数据和正文内容，输出 JSON 供后续分析。"""

import os
import re
import json
import glob
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FOLDERS = ["《秋秋很开心》", "《秋秋在分享》"]

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
    # 去除图片 markdown
    text = re.sub(r'!\[.*?\]\(.*?\)', '', body)
    # 去除 HTML 注释
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # 去除链接但保留文字
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    # 去除 markdown 标题标记
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    # 去除粗体/斜体标记
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'_+', '', text)
    # 去除引用标记
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    # 去除列表标记
    text = re.sub(r'^[-*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)
    # 去除空行和多余空格
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()
    return text

def extract_date_from_filename(filename):
    """从文件名提取日期。"""
    m = re.match(r'(\d{8})', filename)
    if m:
        date_str = m.group(1)
        try:
            return datetime.strptime(date_str, "%Y%m%d").strftime("%Y-%m-%d")
        except:
            pass
    return None

def process_file(filepath, account_name):
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
    title = meta.get("name", "")
    if not title:
        title = re.sub(r'\.md$', '', filename)
        title = re.sub(r'^\d{8}-', '', title)
        title = title.replace("_", " ")

    date = meta.get("published", "")
    if not date:
        date = extract_date_from_filename(filename)

    description = meta.get("description", "")
    tags = meta.get("tags", [])
    source = meta.get("source", "")

    return {
        "filename": filename,
        "account": account_name,
        "title": title,
        "date": date,
        "description": description,
        "tags": tags,
        "source": source,
        "word_count": word_count,
        "content_preview": clean_text[:500],
        "content_full": clean_text,
    }

def main():
    all_articles = []
    for folder in FOLDERS:
        folder_path = os.path.join(BASE_DIR, folder)
        account_name = folder.strip("《》")
        files = glob.glob(os.path.join(folder_path, "*.md"))
        print(f"处理 {account_name}: {len(files)} 篇")
        for fp in sorted(files):
            article = process_file(fp, account_name)
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

    print(f"\n数据已保存到: {output_path}")

if __name__ == "__main__":
    main()
