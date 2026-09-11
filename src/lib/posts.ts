import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

export type Post = CollectionEntry<'blog'>

const NESTED_PREFIXES = ['kennisbank/', 'reviews/', 'begrafenisondernemer/', 'de/']

export function isNestedSection(id: string): boolean {
  return NESTED_PREFIXES.some((prefix) => id.startsWith(prefix))
}

/** /blog/ — category Blog, plus root-level CMS posts that Payload synced without that category. */
export function isBlogIndexPost(post: Post): boolean {
  const categories = post.data.categories ?? []
  if (categories.includes('Blog')) return true
  return !isNestedSection(post.id)
}

export async function getBlogIndexPosts(): Promise<Post[]> {
  const all = await getCollection('blog')
  return all
    .filter(isBlogIndexPost)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}

export function findPostBySectionSlug(all: Post[], section: string, slug: string): Post | undefined {
  return (
    all.find((p) => p.id === `${section}/${slug}`) ??
    all.find((p) => p.id === slug) ??
    all.find((p) => p.id.endsWith(`/${slug}`))
  )
}

export function postHref(post: Post): string {
  return `/${post.id}/`
}
