import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    // Extra, optioneel: bewaart de exacte <title> van de WordPress-bron
    // en markeert of de affiliate-vergelijker op deze pagina actief was.
    metaTitle: z.string().optional(),
    compare: z.boolean().optional(),
  }),
});

export const collections = { blog };
