import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const allPosts = (await getCollection('post', (post) => !post.data.draft && typeof post.body === 'string'))
    .filter(
      (post) =>
        !post.id.startsWith('about/') &&
        !post.data.friends &&
        !post.data.friendGroups &&
        !post.data.moments &&
        !post.data.watching
    )
    .map((post) => ({
      id: post.id,
      originalFileName: post.id.toLowerCase(),
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      tags: post.data.tags,
      category: post.data.category,
      body: post.body,
    }));

  return new Response(JSON.stringify(allPosts), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
