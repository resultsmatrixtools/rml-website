import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/blog';

// RSS feed (BRIEF.md §4). Published posts only — drafts never appear in
// the feed, even on staging (feed readers cache aggressively).
export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Results Matrix Limited — Blog',
    description:
      "Insights on strategy, research, data, and monitoring, evaluation & learning from Results Matrix Limited's practice across the Caribbean.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
