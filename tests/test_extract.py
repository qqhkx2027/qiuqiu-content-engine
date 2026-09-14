#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""最小自检：验证 extract_articles.py 的核心纯函数不回归。运行: python3 tests/test_extract.py"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "content", "公众号"))
import extract_articles as ea


def assert_true(cond, msg):
    if not cond:
        raise AssertionError(msg)
    print("  ok -", msg)


print("front matter 解析:")
m, body = ea.parse_front_matter('---\nname: "测试"\ntags: ["a", "b"]\npublished: 2023-02-02\n---\n正文')
assert_true(m.get("name") == "测试", "name 字段")
assert_true(m.get("tags") == ["a", "b"], "tags 数组")
assert_true(m.get("published") == "2023-02-02", f"published -> {m.get('published')}")
assert_true("正文" in body, "body 分离")

print("日期:文件名提取:")
d = ea.extract_date_from_filename("20230202-xxx.md")
assert_true(d == "2023-02-02", f"文件名日期 -> {d}")

print("auto 分类:")
pillars, types = ea.load_taxonomy()
hits = ea.classify_by_alias(pillars, "提前退休 财务自由 理财")
assert_true("freedom" in hits, f"freedom 命中 {hits}")
thits = ea.classify_by_alias(types, "教程 步骤")
assert_true("tutorial" in thits, f"tutorial 命中 {thits}")

print("id 生成:")
import os as _os
_tmpd = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "content", "公众号", "《秋秋在分享》")
_tmpp = _os.path.join(_tmpd, "20230101-test-article.md")
with open(_tmpp, "w", encoding="utf-8") as _f:
    _f.write("---\nname: 测试\n---\n正文")
try:
    art = ea.process_file(_tmpp, "秋秋在分享", [], [])
    assert_true(art["id"].startswith("qq-20230101-"), f"id 格式 {art['id']}")
finally:
    _os.remove(_tmpp)

print("\n全部通过 ✓")