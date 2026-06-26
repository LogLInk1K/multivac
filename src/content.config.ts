import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const isProd = import.meta.env.PROD;

const post = defineCollection({
	loader: glob({
		base: './post',
		pattern: isProd
			? ['**/*.md', '**/*.mdx', '**/*.yml', '**/*.yaml', '!example/**/*']
			: ['**/*.md', '**/*.mdx', '**/*.yml', '**/*.yaml']
	}),
	schema: z.object({
			title: z.string().min(1, { message: '标题不能为空' }),
			description: z.string().min(10, { message: '描述至少需要10个字符' }),
			content: z.string().optional(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.string().optional(),
			tags: z.array(z.string()).default([]),
			category: z.string().optional(),
			draft: z.boolean().default(false),
			author: z.string().default('波罗歌'),
			readingTime: z.number().optional(),
			password: z.string().optional(),
			passwordHint: z.string().optional(),
			// Friends page data
			sections: z
				.array(
					z.object({
						title: z.string(),
						content: z.string(),
					}),
				)
				.optional(),
			friends: z.array(z.object({
				name: z.string(),
				url: z.string(),
				avatar: z.string(),
				description: z.string(),
			})).optional(),
			friendGroups: z.array(z.object({
				title: z.string(),
				description: z.string().optional(),
				friends: z.array(z.object({
					name: z.string(),
					url: z.string(),
					avatar: z.string(),
					description: z.string(),
				})),
			})).optional(),
			// Moments page data
			moments: z.array(z.object({
				content: z.string(),
				date: z.coerce.date(),
				images: z.array(z.string()).optional(),
			})).optional(),
			// Watching page data
			watching: z.array(z.object({
				title: z.string(),
				year: z.number(),
				cover: z.string(),
				comment: z.string(),
				type: z.string(),
				country: z.string().optional(),
				ratings: z.array(z.object({
					source: z.enum(['douban', 'bangumi']),
					score: z.number(),
				})).optional(),
				links: z.array(z.object({
					source: z.enum(['douban', 'bangumi']),
					url: z.string(),
				})).optional(),
			})).optional()
		}),
});

export const collections = { post };
