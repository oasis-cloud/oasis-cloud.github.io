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
  },
})
