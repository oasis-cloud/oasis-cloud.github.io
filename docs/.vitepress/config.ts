import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Oasis's Cloud",
  description:
    '一个人的首要责任，就是要有雄心。雄心是一种高尚的激情，它可以采取多种合理的形式。—— 《一个数学家的辩白》',
  srcDir: '.',
  outDir: '../dist',
  cleanUrls: false,
  appearance: false,
  ignoreDeadLinks: true,
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-light',
    },
    math: true,
    anchor: {
      permalink: false,
    },
    config(md) {
      const fence = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          const content = token.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          return `<pre class="mermaid">${content}</pre>\n`
        }
        return fence?.(tokens, idx, options, env, self) ?? ''
      }
    },
  },
})
