import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog collection (BRIEF.md §4). Schema fields are fixed by the brief;
// heroImageAlt is required whenever heroImage is set (alt text enforced
// at the schema level as well as in the CMS config, Phase 5).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        author: z.string(),
        tags: z.array(z.string()).default([]),
        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
        draft: z.boolean().default(true),
      })
      .refine((data) => !data.heroImage || (data.heroImageAlt ?? '').length > 0, {
        message: 'heroImageAlt is required when heroImage is set',
        path: ['heroImageAlt'],
      }),
});

export const collections = { blog };
