import { defineCollection, z } from "astro:content";
import { readdirSync, readFileSync } from "fs";

/** directory containing all book files */
const root = `./books/`;

const bookSchema = z.object({
  id: z.string(),
  server: z.string(),
  signee: z.string(),
  title: z.string(),
  pages: z.array(z.string()),
});

type Book = z.infer<typeof bookSchema>;

const clean = (s: string) =>
  s
    .replaceAll(/[ ./\\%:?&#\'\"\[\]<>()]+/g, " ")
    .trim()
    .replaceAll(" ", "_");

const parsers: { [ending: string]: (path: string) => Book } = {
  stendhal: (path: string) => {
    const file = readFileSync(`${root}/${path}`)
      .toString()
      .replaceAll("\r", "");

    let [server, signee, title] = path.split("/");

    const [pre, post] = file.split("\npages:\n#- ");

    for (const line of pre.split("\n")) {
      const [key, val] = line.split(":").map((s) => s.trim());
      if (key === "title") title = val;
      if (key === "author") signee = val;
    }

    const pages = post.split("\n#- ");
    // remove empty pages at the end
    while (!pages.at(-1)) pages.pop();

    const id = [server, signee, title].map(clean).join("/");
    console.log(`Parsed book: ${id} (${pages.length} pages)`);
    return { id, server, signee, title, pages };
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
