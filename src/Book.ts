import { readdirSync, readFileSync } from "fs";

/** directory containing all book files */
const root = `books/`;

export interface Book {
  origin: string;
  signee: string;
  title: string;
  pages: string[];
}

export const parsers: { [ending: string]: (path: string) => Book } = {
  stendhal: (path: string) => {
    const file = readFileSync(`${root}/${path}`)
      .toString()
      .replaceAll("\r", "");

    let [origin, signee, title] = path.split("/");

    const [pre, post] = file.split("\npages:\n#- ");

    for (const line of pre.split("\n")) {
      const [key, val] = line.split(":").map((s) => s.trim());
      if (key === "title") title = val;
      if (key === "author") signee = val;
    }

    const pages = post.split("\n#- ");
    // remove empty pages at the end
    while (!pages.at(-1)) pages.pop();

    return { origin, signee, title, pages };
  },
};

const clean = (s: string) =>
  s
    .replaceAll(/[ ./\\%:?&#\'\"\[\]<>()]+/g, " ")
    .trim()
    .replaceAll(" ", "_");

export const booksByPath = new Map<string, Book>();

for (const path of readdirSync(root, { recursive: true }) as string[]) {
  const ending = path.substring(1 + path.lastIndexOf("."));

  const book = parsers[ending]?.(path);
  if (!book) continue;

  const key = [book.origin, book.signee, book.title].map(clean).join("/");

  booksByPath.set(key, book);
}
