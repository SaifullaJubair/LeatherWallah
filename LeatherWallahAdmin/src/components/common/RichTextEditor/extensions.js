// Tiptap extension set for the reusable RichTextEditor.
// Ported from the production contract editor in Sams-360 (battle-tested):
//   - FontSize as a textStyle attribute
//   - FontFamily with quoting + generic fallback
//   - TextAlign includes `listItem` so aligning a list doesn't leave the
//     bullet/number flush-left while the text shifts (the bug we hit before)
//   - Table with resize DISABLED (column-resize listeners caused hangs)
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
// StarterKit v3 already bundles Underline + Link, so they are configured via
// StarterKit, not imported separately (avoids duplicate-extension errors).
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextAlign } from "@tiptap/extension-text-align";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";

// Font size — Tiptap has no built-in font-size mark, so attach it as a
// textStyle attribute (same approach as the contract editor).
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

// Generic CSS family fallback so an un-installed font still degrades to a
// same-class family (serif/sans/mono) rather than a random default.
const familyFallback = (family) => {
  const f = (family || "").toLowerCase();
  if (/courier|mono|consolas|lucida console|monaco/.test(f)) return "monospace";
  if (/times|serif|georgia|garamond|palatino|book antiqua/.test(f)) return "serif";
  return "sans-serif";
};

// FontFamily that quotes multi-word names and appends a generic fallback, and
// on parse keeps only the primary name so the dropdown shows the picked font.
const RtFontFamily = FontFamily.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (el) => {
              const raw = el.style.fontFamily;
              if (!raw) return null;
              const primary = raw.split(",")[0].replace(/['"]+/g, "").trim();
              return primary || null;
            },
            renderHTML: (attrs) => {
              if (!attrs.fontFamily) return {};
              const quoted = /\s/.test(attrs.fontFamily)
                ? `'${attrs.fontFamily}'`
                : attrs.fontFamily;
              return {
                style: `font-family: ${quoted}, ${familyFallback(attrs.fontFamily)}`,
              };
            },
          },
        },
      },
    ];
  },
});

export const RTE_FONT_FAMILIES = [
  "Arial", "Helvetica", "Times New Roman", "Georgia", "Courier New",
  "Verdana", "Calibri", "Tahoma", "Trebuchet MS", "Palatino",
  "Garamond", "Lucida Console", "Century Gothic", "Comic Sans MS",
  "Impact", "Consolas",
];

export const RTE_FONT_SIZES = [
  "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px",
];

export const buildEditorExtensions = () => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } },
  }),
  TextStyle,
  FontSize,
  RtFontFamily,
  Color,
  Highlight.configure({ multicolor: true }),
  // listItem included so aligning a list item also aligns its marker (fixes the
  // "text centres but bullet stays left" bug).
  TextAlign.configure({ types: ["heading", "paragraph", "listItem"] }),
  // Resize disabled — column-resize pointer listeners caused tab hangs.
  Table.configure({ resizable: false, lastColumnResizable: false }),
  TableRow,
  TableHeader,
  TableCell,
];
