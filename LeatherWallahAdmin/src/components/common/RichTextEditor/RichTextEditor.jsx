import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";

import { buildEditorExtensions } from "./extensions";
import Toolbar from "./Toolbar";
import "./richtext.css"; // shared content look (must match the PDP)
import "./editor.css"; // editor chrome (admin only)

/**
 * Reusable rich-text editor (Tiptap v3). Drop-in for any admin create/edit page:
 *
 *   <RichTextEditor value={html} onChange={setHtml} placeholder="..." />
 *
 * Props:
 *   value        - HTML string (controlled).
 *   onChange     - (html) => void, fired on edit.
 *   placeholder  - empty-state text.
 *   minHeight    - editable min height (px), default 220.
 *   className    - extra classes on the wrapper.
 *
 * Notes:
 *   - Images are intentionally NOT enabled (product Media has its own uploader;
 *     keeps description HTML/DB light).
 *   - The editable area carries `.rt-content` so it looks exactly like the PDP,
 *     which imports the same richtext.css.
 */
export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write here…",
  minHeight = 220,
  className = "",
  readOnly = false,
}) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: buildEditorExtensions(),
    content: value || "",
    editorProps: {
      attributes: {
        class: "rt-content rte-editable",
        "data-placeholder": placeholder,
        style: `--rte-min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Tiptap emits "<p></p>" for an empty doc — normalise to "" so required
      // validators upstream treat a cleared editor as empty.
      onChange?.(html === "<p></p>" ? "" : html);
    },
    immediatelyRender: false, // avoid SSR hydration warnings (harmless in SPA)
  });

  // Toggle editability when the readOnly prop changes (e.g. Policies edit/view).
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  // Keep the editor in sync when the parent resets `value` (e.g. edit-form load,
  // form reset). Guard against feedback loops by comparing to current HTML.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (incoming !== current && incoming !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className={`rte-wrap ${className}`}>
      {!readOnly && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
