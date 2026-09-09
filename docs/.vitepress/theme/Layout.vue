<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { Content, useData, useRoute } from 'vitepress'
import Giscus from './components/Giscus.vue'
import { initImageZoom } from './useImageZoom'

const { frontmatter, page } = useData()
const route = useRoute()

const SITE_TITLE = "Oasis's Cloud"
const SITE_TAGLINE =
  '一个人的首要责任，就是要有雄心。雄心是一种高尚的激情，它可以采取多种合理的形式。<br />—— 《一个数学家的辩白》'

const pageTitle = computed(() => frontmatter.value.title as string | undefined)
const subtitle = computed(
  () =>
    (frontmatter.value.subTitle as string | undefined) ||
    (frontmatter.value.subtitle as string | undefined),
)
const author = computed(() => frontmatter.value.author as string | undefined)

const bodyClass = computed(() => {
  const path = page.value.relativePath.replace(/\\/g, '/')
  if (path === 'index.md') return 'node homepage'
  const slug = path
    .replace(/\.md$/, '')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()
  const parts = path.replace(/\.md$/, '').split('/')
  const ancestors = parts
    .slice(0, -1)
    .map((_, i) =>
      'node-' +
      parts
        .slice(0, i + 1)
        .join('-')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .toLowerCase(),
    )
  return ['node-' + slug, ...ancestors].join(' ')
})

function applyBodyClass() {
  document.body.className = bodyClass.value
}

async function afterPageReady() {
  applyBodyClass()
  await nextTick()
  // Allow Content to paint before binding zoom handlers
  requestAnimationFrame(() => initImageZoom())
}

onMounted(() => {
  afterPageReady()
})

watch(
  () => route.path,
  () => {
    const check = document.getElementById('menu-check') as HTMLInputElement | null
    if (check) check.checked = false
    afterPageReady()
  },
)
</script>

<template>
  <div class="graphite-page">
    <header class="masthead">
      <h1>
        <a href="/">{{ SITE_TITLE }}</a>
      </h1>
      <p class="tagline" v-html="SITE_TAGLINE" />
      <nav class="menu">
        <input id="menu-check" type="checkbox" />
        <label id="menu-label" for="menu-check" class="unselectable">
          <span class="icon close-icon">✕</span>
          <span class="icon open-icon">☰</span>
          <span class="text">Menu</span>
        </label>
        <ul>
          <li><a href="/">首页</a></li>
        </ul>
      </nav>
    </header>

    <article class="main">
      <header class="title" v-if="pageTitle">
        <h1 v-html="pageTitle" />
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        <p v-if="author" class="author">作者：{{ author }}</p>
        <hr />
      </header>
      <Content />
    </article>

    <Giscus />
  </div>
</template>
