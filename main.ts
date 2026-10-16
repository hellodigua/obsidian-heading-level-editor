import { Editor, Plugin } from "obsidian";
import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from "@codemirror/view";

const headingPrefix = /^(\s{0,3})(#{1,6})([ \t]+)/;
const codeBlockNodes = new Set(["FencedCode", "IndentedCode", "CodeBlock"]);

class HeadingMarkerViewPlugin {
  decorations: DecorationSet;
  atomicRanges: DecorationSet = Decoration.none;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  /**
   * 直接扫描可见行的标题前缀，兼容不同版本 Markdown 语法树的标题节点名称。
   * 同时仍通过语法树排除代码块，避免把代码里的 # 误判为标题。
   * 用行样式显示 H1-H6；仅折叠井号，保留分隔空格作为输入法的文本落点。
   */
  private buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const atomicBuilder = new RangeSetBuilder<Decoration>();
    const decoratedLines = new Set<number>();

    for (const range of view.visibleRanges) {
      const firstLine = view.state.doc.lineAt(range.from).number;
      const lastLine = view.state.doc.lineAt(range.to).number;

      for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber += 1) {
        const line = view.state.doc.line(lineNumber);
        if (decoratedLines.has(line.number) || this.isCodeBlock(view, line.from)) {
          continue;
        }

        const match = headingPrefix.exec(line.text);
        if (!match) {
          continue;
        }

        const from = line.from + match[1].length;
        const to = from + match[2].length;
        builder.add(
          line.from,
          line.from,
          Decoration.line({
            attributes: {
              class: "stable-heading-editor-line",
              "data-heading-level": `H${match[2].length}`
            }
          })
        );
        builder.add(
          from,
          to,
          // 不折叠分隔空格，避免正文首字的组合输入紧邻替换组件。
          Decoration.replace({ inclusive: false })
        );
        // 只对分隔空格抵消一次宽度，输入法预编辑文字仍使用正常字距。
        builder.add(
          to,
          to + match[3].length,
          Decoration.mark({
            class: "stable-heading-editor-separator",
            attributes: {
              style: `--stable-heading-separator-width: ${match[3].length}ch`
            }
          })
        );
        // 光标跳过整个隐藏前缀，分隔空格仍保留在 DOM 中供输入法使用。
        atomicBuilder.add(
          from,
          to + match[3].length,
          Decoration.mark({})
        );
        decoratedLines.add(line.number);
      }
    }

    this.atomicRanges = atomicBuilder.finish();
    return builder.finish();
  }

  /** 判断当前行是否位于代码块语法节点内，避免隐藏示例代码中的 #。 */
  private isCodeBlock(view: EditorView, position: number): boolean {
    let node = syntaxTree(view.state).resolveInner(position, 1);
    while (node) {
      if (codeBlockNodes.has(node.name)) {
        return true;
      }

      const parent = node.parent;
      if (!parent) {
        break;
      }

      node = parent;
    }

    return false;
  }
}

const headingMarkerExtension = ViewPlugin.fromClass(HeadingMarkerViewPlugin, {
  decorations: (value) => value.decorations,
  provide: (plugin) =>
    EditorView.atomicRanges.of((view) =>
      view.plugin(plugin)?.atomicRanges ?? Decoration.none
    )
});

export default class StableHeadingEditorPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerEditorExtension(headingMarkerExtension);

    for (let level = 1; level <= 6; level += 1) {
      this.addCommand({
        id: `set-heading-${level}`,
        name: `将当前行设为 ${level} 级标题`,
        hotkeys: level <= 3 ? [{ modifiers: ["Mod", "Alt"], key: String(level) }] : [],
        editorCallback: (editor) => this.setHeadingLevel(editor, level)
      });
    }

    this.addCommand({
      id: "clear-heading",
      name: "将当前行设为普通段落",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "0" }],
      editorCallback: (editor) => this.clearHeadingLevel(editor)
    });
  }

  /** 将选中行统一转换为指定层级的 ATX 标题，并保留原有缩进及正文内容。 */
  private setHeadingLevel(editor: Editor, level: number): void {
    const startLine = editor.getCursor("from").line;
    const endLine = editor.getCursor("to").line;

    for (let lineNumber = endLine; lineNumber >= startLine; lineNumber -= 1) {
      const line = editor.getLine(lineNumber);
      const match = /^(\s{0,3})(?:#{1,6}[ \t]+)?(.*)$/.exec(line);
      if (!match) {
        continue;
      }

      editor.setLine(lineNumber, `${match[1]}${"#".repeat(level)} ${match[2]}`);
    }
  }

  /** 仅移除普通 ATX 标题的行首标记；非标题内容保持原样。 */
  private clearHeadingLevel(editor: Editor): void {
    const startLine = editor.getCursor("from").line;
    const endLine = editor.getCursor("to").line;

    for (let lineNumber = endLine; lineNumber >= startLine; lineNumber -= 1) {
      const line = editor.getLine(lineNumber);
      const match = /^(\s{0,3})#{1,6}[ \t]+(.*)$/.exec(line);
      if (match) {
        editor.setLine(lineNumber, `${match[1]}${match[2]}`);
      }
    }
  }
}
