import { defineCollection, z } from "astro:content";
import { readdirSync, readFileSync } from "fs";
import { sep as SEPERATOR } from "path";

/** directory containing all book files */
const root = `./books/`;

export const bookSchema = z.object({
  id: z.string(),
  server: z.string(),
  signee: z.string(),
  title: z.string(),
  pages: z.array(z.string()),
});

export type Book = z.infer<typeof bookSchema>;

function clean(s: string) {
  const cleaned = s
    .replaceAll(/[ ./\\%:?&#\'\"\[\]<>()]+/g, " ")
    .trim()
    .replaceAll(" ", "_");
  return cleaned || s.replaceAll(/[ ./\\%:?&#\'\"\[\]<>()]/g, "_");
}

const parsers: { [ending: string]: (path: string) => Book } = {
  stendhal: (path: string) => {
    try {
      const fileRaw = readFileSync(`${root}/${path}`);
      const file = fileRaw.toString().replaceAll("\r", "");

      let [server, signee, title] = path.split(SEPERATOR);

      const [pre, post] = file.split("\npages:\n#- ");

      for (const line of pre.split("\n")) {
        const col = line.indexOf(":");
        const key = line.substring(0, col);
        const val = line.substring(1 + col).trim();
        if (key === "title") title = val;
        if (key === "author") signee = val;
      }

      const pages = post.split("\n#- ");
      // remove empty pages at the end
      while (pages.length && !pages.at(-1)) pages.pop();

      const id = [server, signee, title].map(clean).join("/");
      return { id, server, signee, title, pages };
    } catch (err) {
      console.error(`Error in ${path}:`, err);
      throw err;
    }
  },
};

const books = defineCollection({
  loader: async () => {
    const books: Book[] = [];

    for (const path of readdirSync(root, { recursive: true }) as string[]) {
      const ending = path.substring(1 + path.lastIndexOf("."));

      const book = parsers[ending]?.(path);
      if (!book) continue;

      books.push(book);
    }

    return books;
  },
  schema: bookSchema,
});

export const collections = { books };
