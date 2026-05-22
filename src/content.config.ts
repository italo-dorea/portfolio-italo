import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { file, glob } from "astro/loaders";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: file("src/data/posts.json"),
  schema: z.object({
    id: z.string(),
    title_pt: z.string(),
    title_en: z.string(),
    summary_pt: z.string(),
    summary_en: z.string(),
    content_pt: z.string(),
    content_en: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(true),
  }).transform(data => ({
    ...data,
    author: "",
    title: data.title_pt, // fallback for astro-paper search/sorting
    description: data.summary_pt, // fallback for astro-paper search/sorting
    pubDatetime: data.date, // fallback for astro-paper datetime
    modDatetime: undefined as Date | undefined,
    featured: false,
    draft: !data.published,
    ogImage: undefined as string | undefined,
    canonicalURL: undefined as string | undefined,
    timezone: undefined as string | undefined,
    hideEditPost: undefined as boolean | undefined,
  })),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
