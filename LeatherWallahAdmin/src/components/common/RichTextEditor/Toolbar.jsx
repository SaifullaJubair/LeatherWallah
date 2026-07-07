import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough, FaLink, FaUnlink,
  FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaTrash, FaQuoteRight, FaUndo, FaRedo, FaIndent, FaOutdent,
} from "react-icons/fa";
import { MdFormatColorText, MdFormatColorFill } from "react-icons/md";
import ColorPopover from "./ColorPopover";
import TablePicker from "./TablePicker";
import { RTE_FONT_FAMILIES, RTE_FONT_SIZES } from "./extensions";

const Btn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    className={`rte-btn${active ? " is-active" : ""}`}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {children}
  </button>
);

const Sep = () => <span className="rte-sep" />;

const HEADINGS = [
  { label: "Normal", value: "p" },
  { label: "Heading 1", value: "1" },
  { label: "Heading 2", value: "2" },
  { label: "Heading 3", value: "3" },
];

export default function Toolbar({ editor }) {
  if (!editor) return null;

  const headingValue = [1, 2, 3].find((l) => editor.isActive("heading", { level: l }));
  const setHeading = (v) =>
    v === "p"
      ? editor.chain().focus().setParagraph().run()
      : editor.chain().focus().toggleHeading({ level: Number(v) }).run();

  const currentFontFamily = editor.getAttributes("textStyle").fontFamily || "";
  const currentFontSize = editor.getAttributes("textStyle").fontSize || "";
  const currentColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";

  const setFontFamily = (v) =>
    v ? editor.chain().focus().setFontFamily(v).run() : editor.chain().focus().unsetFontFamily().run();
  const setFontSize = (v) =>
    v ? editor.chain().focus().setFontSize(v).run() : editor.chain().focus().unsetFontSize().run();

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL", prev);
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const inTable = editor.isActive("table");
  const inList = editor.isActive("bulletList") || editor.isActive("orderedList");

  return (
    <div className="rte-toolbar">
      {/* Block type */}
      <select className="rte-select" value={headingValue ? String(headingValue) : "p"}
        onChange={(e) => setHeading(e.target.value)} title="Text style">
        {HEADINGS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
      </select>

      {/* Font family */}
      <select className="rte-select" style={{ fontFamily: currentFontFamily || "inherit" }}
        value={currentFontFamily} onChange={(e) => setFontFamily(e.target.value)} title="Font">
        <option value="" style={{ fontFamily: "inherit" }}>Font</option>
        {RTE_FONT_FAMILIES.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </select>

      {/* Font size */}
      <select className="rte-select" value={currentFontSize}
        onChange={(e) => setFontSize(e.target.value)} title="Font size">
        <option value="">Size</option>
        {RTE_FONT_SIZES.map((s) => <option key={s} value={s}>{s.replace("px", "")}</option>)}
      </select>

      <Sep />

      {/* Inline marks */}
      <Btn title="Bold" active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}><FaBold /></Btn>
      <Btn title="Italic" active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}><FaItalic /></Btn>
      <Btn title="Underline" active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}><FaUnderline /></Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}><FaStrikethrough /></Btn>

      {/* Text color + Highlight (swatch + custom picker) */}
      <ColorPopover
        mode="text" title="Text colour" currentColor={currentColor}
        isActive={!!currentColor} trigger={<MdFormatColorText />}
        onSelect={(c) => editor.chain().focus().setColor(c).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPopover
        mode="highlight" title="Highlight" currentColor={currentHighlight}
        isActive={editor.isActive("highlight")} trigger={<MdFormatColorFill />}
        onSelect={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <Sep />

      {/* Lists + quote */}
      <Btn title="Bullet list" active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl /></Btn>
      {/* Nest / un-nest a list item (also works via Tab / Shift+Tab). */}
      <Btn title="Indent (nest list item)" disabled={!inList}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><FaIndent /></Btn>
      <Btn title="Outdent (un-nest list item)" disabled={!inList}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}><FaOutdent /></Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}><FaQuoteRight /></Btn>

      <Sep />

      {/* Alignment (also applies to list items — fixes the marker-align bug) */}
      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}><FaAlignLeft /></Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}><FaAlignCenter /></Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}><FaAlignRight /></Btn>
      <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}><FaAlignJustify /></Btn>

      <Sep />

      {/* Link */}
      <Btn title="Add link" active={editor.isActive("link")} onClick={setLink}><FaLink /></Btn>
      <Btn title="Remove link" disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}><FaUnlink /></Btn>

      <Sep />

      {/* Table — grid picker to insert; row/col controls when inside a table */}
      <TablePicker
        onInsert={(rows, cols) =>
          editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
        }
      />
      {inTable && (
        <>
          <Btn title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>+Col</Btn>
          <Btn title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>−Col</Btn>
          <Btn title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>+Row</Btn>
          <Btn title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>−Row</Btn>
          <Btn title="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Hdr</Btn>
          <Btn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}><FaTrash /></Btn>
        </>
      )}

      <Sep />

      {/* History */}
      <Btn title="Undo" disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}><FaUndo /></Btn>
      <Btn title="Redo" disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}><FaRedo /></Btn>
    </div>
  );
}
