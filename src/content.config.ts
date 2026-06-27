import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const isProd = import.meta.env.PROD;

const post = defineCollection({
	loader: glob({
		base: './post',
		pattern: isProd
			? ['**/*.md', '**/*.mdx', '**/*.yaml', '!example/**/*']
			: ['**/*.md', '**/*.mdx', '**/*.yaml']
	}),
	schema: z.object({
			title: z.string().min(1, { message: '标题不能为空' }),
			description: z.string().min(10, { message: '描述至少需要10个字符' }),
			content: z.string().optional(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.string().optional(),
			heroImageWidth: z.string().optional(),
			showDate: z.boolean().default(true),
			tags: z.array(z.string()).default([]),
			category: z.string().optional(),
			draft: z.boolean().default(false),
			author: z.string().optional(),
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

const config = defineCollection({
	loader: glob({
		base: '.',
		pattern: ['config.example.yaml', 'config.multivac.yaml'],
	}),
	schema: z.object({
		site: z.object({
			title: z.string(),
			description: z.string(),
			logo: z.string(),
			lang: z.string().default('zh-CN'),
			startYear: z.number(),
			startDate: z.string(),
			postsPerPage: z.number().int().min(1).default(4),
			archivesPerPage: z.number().int().min(1).default(13),
		}),
		author: z.object({
			name: z.string(),
			avatar: z.string(),
			slogan: z.string(),
			subSlogan: z.string(),
			description: z.string(),
		}),
		nav: z.object({
			headerLinks: z.array(z.object({
				label: z.string(),
				href: z.string(),
			})),
			menuLinks: z.array(z.object({
				label: z.string(),
				href: z.string(),
				icon: z.string(),
				external: z.boolean().default(false),
				iconScale: z.number().optional(),
			})),
		}),
		social: z.array(z.object({
			name: z.string(),
			url: z.string(),
			icon: z.string(),
		})),
		music: z.object({
			playlistUrl: z.url(),
			apiEndpoints: z.array(z.url()),
		}),
		comment: z.object({
			twikoo: z.object({
				envId: z.string(),
				version: z.string(),
			}),
		}),
		assets: z.object({
			defaultCover: z.string(),
			defaultAbout: z.string(),
			wechatQr: z.string(),
			alipayQr: z.string(),
			emojiFiles: z.array(z.string()),
			tenYearPledgeLogo: z.string(),
		}),
		footer: z.object({
			homeUrl: z.url(),
			license: z.string(),
			licenseUrl: z.url(),
			icpNumber: z.string(),
			icpUrl: z.url(),
		}),
		greetings: z.array(z.object({
			hourStart: z.number().int().min(0).max(28),
			hourEnd: z.number().int().min(0).max(29),
			text: z.string(),
		})),
		preconnect: z.array(z.string()),
		tenYearPledge: z.object({
			url: z.url(),
			wormholeUrl: z.url(),
		}),
		passwordHint: z.string(),
	}),
});

export const collections = { post, config };
