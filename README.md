# Stable Heading Editor

本地 Obsidian 插件，只优化实时预览中的 ATX 标题（`#` 至 `######`）。

写这个插件，是因为主包非常喜欢语雀的可视化编辑体验：可视化的编辑方式非常舒服，标题在编辑时不会突然露出 `#` 标记，也不会让标题文字向右跳动。

## 具体改动如下

- 标题的 Markdown 标记在编辑时保持隐藏，标题文字不会因光标聚焦而横向跳动。
- 代码块中的 `#` 不会被处理。
- `⌘⌥1`、`⌘⌥2`、`⌘⌥3`：将当前行或所选行转换为 H1、H2、H3。
- `⌘⌥0`：将当前行或所选行转换为普通段落。
- H4–H6 可在命令面板中搜索“将当前行设为”后执行。

底层仍是标准 Markdown；该插件不改写文件内容，只有执行标题层级命令时才会更新选中行。

## 如何安装

### 通过 BRAT 安装（推荐）

适合测试版与后续自动更新：

1. 在 Obsidian 的「社区插件」中安装并启用 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 打开命令面板，执行 `BRAT: Add a beta plugin for testing`。
3. 粘贴本仓库的 GitHub 地址并确认。
4. 回到「社区插件」启用 **Stable Heading Editor**。

### 手动安装

1. 在本仓库的 GitHub Releases 页面下载 `main.js`、`manifest.json` 和 `styles.css`。
2. 在你的笔记库中创建 `.obsidian/plugins/stable-heading-editor/` 目录。
3. 将上述三个文件放入该目录。
4. 重启 Obsidian，然后到「设置 → 社区插件」启用 **Stable Heading Editor**。
