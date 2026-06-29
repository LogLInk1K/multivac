import { getCollection, type CollectionEntry } from 'astro:content';

export async function getSiteConfig() {
  // 优先使用 config.multivac.yaml（个人配置，通常 gitignore）
  // 回退到 config.example.yaml（仓库默认配置）
  const entries = await getCollection('config');
  const multivac = entries.find((e) => e.id === 'configmultivac');
  const example = entries.find((e) => e.id === 'configexample');
  const entry = multivac || example;
  if (!entry) throw new Error('Site config not found: config.example.yaml or config.multivac.yaml is missing');
  return entry.data;
}

/** 过滤出真正的文章条目，排除 about/友链/动态/漫游等非文章数据 */
export function isArticlePost({ data, id }: CollectionEntry<'post'>): boolean {
  return (
    !data.draft && !id.startsWith('about/') && !data.friends && !data.friendGroups && !data.moments && !data.watching
  );
}

export type SiteConfig = Awaited<ReturnType<typeof getSiteConfig>>;
