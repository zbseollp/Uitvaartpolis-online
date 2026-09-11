import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Jenkins sync writes Payload extra onto every markdown file. A numeric
 * `slug` / `id` (WordPress post id) makes Astro's default generateId return
 * a number, then content-layer calls `id.endsWith('.svg')` and the whole
 * `astro build` dies. Keep the filesystem path so /kennisbank/… routes stay
 * intact and one CMS field cannot take the site down.
 */
function fileId({ entry }: { entry: string }): string {
  return String(entry ?? '')
    .replace(/\\/g, '/')
    .replace(/\.(md|mdx)$/i, '');
}

function textFromUnknown(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const s = String(value).trim();
    return s && s !== '[object Object]' ? s : undefined;
  }
  if (Array.isArray(value)) {
    const parts = value.map(textFromUnknown).filter((s): s is string => Boolean(s));
    return parts.length ? parts.join(' ').trim() : undefined;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return (
      textFromUnknown(o.name) ??
      textFromUnknown(o.title) ??
      textFromUnknown(o.value) ??
      textFromUnknown(o.slug) ??
      textFromUnknown(o.url) ??
      textFromUnknown(o.filename)
    );
  }
  return undefined;
}

function stringList(value: unknown): string[] {
  if (value == null || value === '') return [];
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if (Array.isArray(o.docs)) return stringList(o.docs);
    const single = textFromUnknown(value);
    return single ? [single] : [];
  }
  return (Array.isArray(value) ? value : [value])
    .map(textFromUnknown)
    .filter((s): s is string => Boolean(s));
}

function toDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = value < 1e12 ? new Date(value * 1000) : new Date(value);
    if (!Number.isNaN(d.valueOf())) return d;
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value.trim().replace(' ', 'T'));
    if (!Number.isNaN(d.valueOf())) return d;
  }
  return new Date(0);
}

function imageFromUnknown(value: unknown): string | undefined {
  const text = textFromUnknown(value);
  if (!text) return undefined;
  if (text.startsWith('/') || /^https?:\/\//i.test(text) || /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(text)) {
    return text;
  }
  return undefined;
}

function toBool(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function normalizeBlog(raw: unknown) {
  const d = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    title: textFromUnknown(d.title) || 'Artikel',
    description:
      textFromUnknown(d.description) ||
      textFromUnknown(d.excerpt) ||
      textFromUnknown(d.metaDescription) ||
      '',
    pubDate: toDate(d.pubDate ?? d.date),
    updatedDate: d.updatedDate ? toDate(d.updatedDate) : undefined,
    author: textFromUnknown(d.author) || 'Redactie',
    categories: stringList(d.categories),
    tags: stringList(d.tags),
    metaTitle: textFromUnknown(d.metaTitle),
    compare: toBool(d.compare) ?? false,
    image:
      imageFromUnknown(d.image) ??
      imageFromUnknown(d.featuredImage) ??
      imageFromUnknown(d.heroImage),
  };
}

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
    generateId: fileId,
  }),
  schema: z.any().transform((raw) => {
    try {
      return normalizeBlog(raw);
    } catch {
      return normalizeBlog({});
    }
  }),
});

export const collections = { blog };
