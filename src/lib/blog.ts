import { getCollection, type CollectionEntry } from 'astro:content';
import { IS_PRODUCTION } from './site';

/**
 * Draft visibility (BRIEF.md §4): draft posts are excluded from the
 * production build but render on staging and locally. The production
 * test itself lives in `lib/site.ts`.
 */
export const SHOW_DRAFTS = !IS_PRODUCTION;

export type BlogPost = CollectionEntry<'blog'>;

/** Posts visible in this build (drafts filtered on production), newest first. */
export async function getVisiblePosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => SHOW_DRAFTS || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Published (non-draft) posts only — used by the RSS feed in every environment. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Unique tags across the given posts, alphabetical. */
export function collectTags(posts: BlogPost[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}
