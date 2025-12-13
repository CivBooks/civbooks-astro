import { mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";

const clean = (s) =>
  s
    .replaceAll(/[ ./\\%:?&#\'\"\[\]<>()]+/g, " ")
    .trim()
    .replaceAll(" ", "_");

const [root] = process.argv.slice(2);

const madeDirs = new Set();
function mkdirCached(path) {
  if (madeDirs.has(path)) return;
  madeDirs.add(path);
  mkdirSync(path, { recursive: true });
}

const bookPaths = new Map();
function rejectDuplicate(path, book) {
  const had = bookPaths.get(path) || 0;
  bookPaths.set(path, 1 + had);
  return had;
}

const color_code_from_name = {
  black: "0",
  dark_blue: "1",
  dark_green: "2",
  dark_aqua: "3",
  dark_red: "4",
  dark_purple: "5",
  gold: "6",
  gray: "7",
  dark_gray: "8",
  blue: "9",
  green: "a",
  aqua: "b",
  red: "c",
  light_purple: "d",
  yellow: "e",
  white: "f",
};

function str_from_chat_component(component) {
  if (!component) return "";
  if (typeof component === "string") return component;
  let fmt_codes = "";
  if (component.bold) fmt_codes += "§l";
  if (component.italic) fmt_codes += "§o";
  if (component.underlined) fmt_codes += "§n";
  if (component.strikethrough) fmt_codes += "§m";
  if (component.obfuscated) fmt_codes += "§k";
  if (component.color) fmt_codes += "§" + color_code_from_name[component.color];
  const undo_fmt = fmt_codes ? "§r" : "";
  return (
    fmt_codes +
    (component.text || "") +
    (component.extra || [])
      .map((e) => fmt_codes + str_from_chat_component(e) + undo_fmt)
      .join("") +
    undo_fmt
  );
}

const stdin = readFileSync("/dev/stdin").toString();
for (const row of stdin.split("\n")) {
  if (!row.trim()) continue;
  const book = JSON.parse(row);
  let { item_origin, item_title, signee, pages } = book;
  if (!item_title?.trim() || !signee?.trim() || !pages.length) continue;
  if (pages.length === 1 && !pages[0].trim().length) continue;
  item_origin = item_origin.replaceAll(".0", "");
  const path = `${root}/${item_origin}/${signee}/${clean(item_title)}.stendhal`;
  if (rejectDuplicate(path, book)) continue;
  pages = pages.map((p) => {
    if (
      ((p.startsWith("{") && p.endsWith("}")) ||
        (p.startsWith('"') && p.endsWith('"'))) &&
      !p.includes("\n")
    ) {
      try {
        return str_from_chat_component(JSON.parse(p));
      } catch {}
    }
    return p;
  });
  const stendhal =
    `title: ${item_title}\n` +
    `author: ${signee}\n` +
    `pages:\n` +
    `#- ${pages.map((p) => p + "\n#- ").join("")}`;
  mkdirCached(`${root}/${item_origin}/${signee}`);
  writeFile(path, stendhal).catch(console.error);
}

for (const [path, count] of bookPaths.entries()) {
  if (count === 1) continue;
  console.log(count, `duplicates of`, path);
}
