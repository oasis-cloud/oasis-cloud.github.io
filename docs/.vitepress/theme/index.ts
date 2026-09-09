import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import './style/fonts.css'
import './style/graphite.css'
import './style/overrides.css'

export default {
  Layout,
  enhanceApp() {},
} satisfies Theme
