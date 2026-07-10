"use client";
// Resolves an icon key (e.g. "lu:Briefcase", "fa:FaLeaf") into the matching
// React component from lucide-react or react-icons/fa6. Used everywhere the
// admin picks an icon via the IconPicker.
//
// Tree-shaking: we import the WHOLE lucide-react and react-icons/fa6 modules
// once and pick the named export at runtime. Modern bundlers strip unused
// exports, but the dynamic indirection here prevents tree-shaking ALL of
// them away on a page that uses many. In practice the curated registry is
// ~90 icons total — bundle impact is ~20 KB gzipped, acceptable.
//
// Usage:
//   <DynamicIcon name="lu:Briefcase" size={18} className="..." />
//   <DynamicIcon name="fa:FaTruckFast" size={20} style={{...}} />
//   <DynamicIcon name={item.icon_key} fallback={FaUtensils} />

import * as Lucide from "lucide-react";
import * as Fa6 from "react-icons/fa6";

function resolveIcon(name) {
  if (!name || typeof name !== "string") return null;
  const idx = name.indexOf(":");
  if (idx < 0) return null;
  const prefix = name.slice(0, idx);
  const comp = name.slice(idx + 1);
  if (prefix === "lu") return Lucide[comp] || null;
  if (prefix === "fa") return Fa6[comp] || null;
  return null;
}

// True when `name` maps to a real component — i.e. <DynamicIcon name={name} />
// will render something rather than null. Callers that wrap the icon in its own
// chrome (a badge circle, a coloured puck) need this: without it a key that no
// longer resolves leaves an empty decoration behind.
export const hasIcon = (name) => resolveIcon(name) !== null;

export default function DynamicIcon({
  name,
  size = 18,
  className,
  style,
  fallback = null,
  ...rest
}) {
  const Icon = resolveIcon(name) || fallback;
  if (!Icon) return null;
  return <Icon size={size} className={className} style={style} {...rest} />;
}
