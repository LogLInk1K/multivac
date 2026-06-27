import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import type { AstroUserConfig } from 'astro'; 
import fs from 'node:fs';
import YAML from 'yaml';

let siteUrl = 'https://example.com'; 
try {
  const file = fs.readFileSync('./config.multivac.yaml', 'utf-8');
  siteUrl = YAML.parse(file)?.site?.url || siteUrl;
} catch {}

const isVercel: boolean = process.env.VERCEL === '1' || process.env.DEPLOY_PLATFORM === 'vercel';

const config: AstroUserConfig = {
  site: siteUrl,
  trailingSlash: 'never',
  
  integrations: [
    mdx(), 
    sitemap()
  ],

  build: {
    inlineStylesheets: 'auto',
    format: 'file', 
  },

  adapter: isVercel ? vercel({ webAnalytics: { enabled: true } }) : undefined,
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['node:fs', 'node:path'],
    },
    build: {
      minify: true, 
      cssMinify: true,
    },
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport'
  }
};

export default defineConfig(config);