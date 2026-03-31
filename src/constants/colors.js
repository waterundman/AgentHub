export const COLORS = {
  purple: { fill: "#EEEDFE", stroke: "#7F77DD", text: "#3C3489", mid: "#534AB7" },
  teal:   { fill: "#E1F5EE", stroke: "#1D9E75", text: "#085041", mid: "#0F6E56" },
  coral:  { fill: "#FAECE7", stroke: "#D85A30", text: "#4A1B0C", mid: "#993C1D" },
  blue:   { fill: "#E6F1FB", stroke: "#378ADD", text: "#042C53", mid: "#185FA5" },
  amber:  { fill: "#FAEEDA", stroke: "#BA7517", text: "#412402", mid: "#854F0B" },
  green:  { fill: "#EAF3DE", stroke: "#3B6D11", text: "#173404", mid: "#639922" },
};

export const COLOR_KEYS = Object.keys(COLORS);

export const ICON_CHARS = "ABCDEFGHIJKLMNOP";

export const STATUS_MAP = {
  idle:    { label: "待机",   color: "var(--color-text-tertiary)" },
  running: { label: "工作中", color: "#BA7517" },
  done:    { label: "完成",   color: "#1D9E75" },
  error:   { label: "出错",   color: "#E24B4A" },
};
