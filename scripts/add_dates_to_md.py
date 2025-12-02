#!/usr/bin/env python3
"""
为所有 markdown 文件添加 date 字段（如果缺失）
使用 git 获取文件的首次提交日期
"""
import os
import re
import subprocess
from pathlib import Path
from datetime import datetime

def get_file_creation_date(file_path):
    """使用 git log 获取文件的首次提交日期"""
    try:
        # 获取文件的首次提交日期
        result = subprocess.run(
            ['git', 'log', '--diff-filter=A', '--follow', '--format=%ai', '--', file_path],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)) + '/..'
        )
        if result.returncode == 0 and result.stdout.strip():
            # 获取最后一行（最早的提交）
            dates = result.stdout.strip().split('\n')
            if dates:
                date_str = dates[-1].strip()
                # 解析日期并格式化为 YYYY-MM-DD
                try:
                    dt = datetime.strptime(date_str.split()[0], '%Y-%m-%d')
                    return dt.strftime('%Y-%m-%d')
                except:
                    # 如果格式不对，尝试其他格式
                    try:
                        dt = datetime.strptime(date_str.split()[0], '%Y-%m-%d')
                        return dt.strftime('%Y-%m-%d')
                    except:
                        pass
    except Exception as e:
        print(f"Error getting date for {file_path}: {e}")
    
    # 如果 git 方法失败，使用文件系统创建时间
    try:
        stat = os.stat(file_path)
        dt = datetime.fromtimestamp(stat.st_birthtime if hasattr(stat, 'st_birthtime') else stat.st_mtime)
        return dt.strftime('%Y-%m-%d')
    except:
        return None

def has_date_field(content):
    """检查内容是否已有 date 字段"""
    return re.search(r'^date:\s*', content, re.MULTILINE) is not None

def add_date_to_frontmatter(content, date):
    """在 frontmatter 中添加 date 字段"""
    # 匹配 frontmatter 块
    frontmatter_pattern = r'(^---\s*\n)(.*?)(\n---\s*\n)'
    match = re.match(frontmatter_pattern, content, re.DOTALL)
    
    if not match:
        # 如果没有 frontmatter，创建一个
        first_line = content.split('\n')[0] if content else ''
        if not first_line.startswith('---'):
            return f"---\ntitle: \"Untitled\"\nauthor: oasis\ndate: {date}\n---\n\n{content}"
        return content
    
    frontmatter_start = match.group(1)
    frontmatter_content = match.group(2)
    frontmatter_end = match.group(3)
    rest_content = content[match.end():]
    
    # 查找 author 字段的位置
    author_match = re.search(r'^author:\s*.*$', frontmatter_content, re.MULTILINE)
    
    if author_match:
        # 在 author 之后添加 date
        author_line = author_match.group(0)
        insert_pos = author_match.end()
        new_frontmatter = (
            frontmatter_content[:insert_pos] + 
            f'\ndate: {date}' + 
            frontmatter_content[insert_pos:]
        )
    else:
        # 如果没有 author，在 tags 之前添加
        tags_match = re.search(r'^tags:\s*.*$', frontmatter_content, re.MULTILINE)
        if tags_match:
            insert_pos = tags_match.start()
            new_frontmatter = (
                frontmatter_content[:insert_pos] + 
                f'date: {date}\n' + 
                frontmatter_content[insert_pos:]
            )
        else:
            # 直接添加到末尾
            new_frontmatter = frontmatter_content + f'\ndate: {date}'
    
    return frontmatter_start + new_frontmatter + frontmatter_end + rest_content

def process_markdown_file(file_path):
    """处理单个 markdown 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否已有 date 字段
        if has_date_field(content):
            print(f"✓ {file_path} 已有 date 字段，跳过")
            return False
        
        # 获取文件创建日期
        date = get_file_creation_date(file_path)
        if not date:
            print(f"⚠ {file_path} 无法获取日期，跳过")
            return False
        
        # 添加 date 字段
        new_content = add_date_to_frontmatter(content, date)
        
        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✓ {file_path} 已添加 date: {date}")
        return True
    except Exception as e:
        print(f"✗ {file_path} 处理失败: {e}")
        return False

def main():
    """主函数"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    src_dir = project_root / 'src'
    
    if not src_dir.exists():
        print(f"错误: {src_dir} 不存在")
        return
    
    # 找到所有 markdown 文件
    md_files = list(src_dir.rglob('*.md'))
    
    print(f"找到 {len(md_files)} 个 markdown 文件\n")
    
    updated_count = 0
    skipped_count = 0
    
    for md_file in sorted(md_files):
        if process_markdown_file(md_file):
            updated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n完成！")
    print(f"更新: {updated_count} 个文件")
    print(f"跳过: {skipped_count} 个文件")

if __name__ == '__main__':
    main()

