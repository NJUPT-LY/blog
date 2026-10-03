import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// YAML date objects and date strings are valid; null/booleans/numbers must not
// silently become dates near 1970 through JavaScript's Date coercion.
const contentDate = z.union([z.string(), z.date()]).pipe(z.coerce.date());

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: contentDate,
    updatedDate: contentDate.optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog };
