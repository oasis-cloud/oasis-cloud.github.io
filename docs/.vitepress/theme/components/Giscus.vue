<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

function mountGiscus() {
  const existing = document.getElementById('giscus-script')
  if (existing) existing.remove()

  // Clear previous iframe container so pathname remaps cleanly
  const host = document.getElementById('giscus-host')
  if (host) host.innerHTML = ''

  const script = document.createElement('script')
  script.id = 'giscus-script'
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', 'oasis-cloud/blog-comments')
  script.setAttribute('data-repo-id', 'R_kgDOKEliHA')
  script.setAttribute('data-category', 'General')
  script.setAttribute('data-category-id', 'DIC_kwDOKEliHM4CYb6e')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'preferred_color_scheme')
  script.setAttribute('data-lang', 'zh-CN')
  host?.appendChild(script)
}

onMounted(() => {
  mountGiscus()
})

watch(
  () => route.path,
  () => {
    mountGiscus()
  },
)

onBeforeUnmount(() => {
  document.getElementById('giscus-script')?.remove()
})
</script>

<template>
  <div id="giscus-host" />
</template>
