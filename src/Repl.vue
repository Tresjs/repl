<script setup lang="ts">
import { provide, ref, toRef, computed } from 'vue'
import SplitPane from './SplitPane.vue'
import Output from './output/Output.vue'
import type { Store, SFCOptions } from './store'
import { ReplStore } from './store'
import type { EditorComponentType } from './editor/types'
import EditorContainer from './editor/EditorContainer.vue'
import TopBar from './editor/TopBar.vue'

export interface Props {
  theme?: 'dark' | 'light'
  editor: EditorComponentType
  store?: Store
  autoResize?: boolean
  topBar?: boolean
  showCompileOutput?: boolean
  showImportMap?: boolean
  showTsConfig?: boolean
  clearConsole?: boolean
  sfcOptions?: SFCOptions
  layout?: 'horizontal' | 'vertical'
  layoutReverse?: boolean
  ssr?: boolean
  previewOptions?: {
    headHTML?: string
    bodyHTML?: string
    placeholderHTML?: string
    customCode?: {
      importCode?: string
      useCode?: string
    }
  }
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  store: () => new ReplStore(),
  topBar: true,
  autoResize: true,
  showCompileOutput: true,
  showImportMap: true,
  showTsConfig: true,
  clearConsole: true,
  layoutReverse: false,
  ssr: false,
  previewOptions: () => ({
    headHTML: '',
    bodyHTML: '',
    placeholderHTML: '',
    customCode: {
      importCode: '',
      useCode: '',
    },
  }),
})

if (!props.editor) {
  throw new Error('The "editor" prop is now required.')
}

const outputRef = ref<InstanceType<typeof Output>>()
const { store } = props
const sfcOptions = (store.options = props.sfcOptions || {})
if (!sfcOptions.script) {
  sfcOptions.script = {}
}
// @ts-expect-error only needed in 3.3
sfcOptions.script.fs = {
  fileExists(file: string) {
    if (file.startsWith('/')) file = file.slice(1)
    return !!store.state.files[file]
  },
  readFile(file: string) {
    if (file.startsWith('/')) file = file.slice(1)
    return store.state.files[file].code
  },
}

store.init()

const editorSlotName = computed(() => props.layoutReverse ? 'right' : 'left')
const outputSlotName = computed(() => props.layoutReverse ? 'left' : 'right')

provide('store', store)
provide('autoresize', props.autoResize)
provide('import-map', toRef(props, 'showImportMap'))
provide('tsconfig', toRef(props, 'showTsConfig'))
provide('clear-console', toRef(props, 'clearConsole'))
provide('preview-options', props.previewOptions)
provide('theme', toRef(props, 'theme'))
/**
 * Reload the preview iframe
 */
function reload() {
  outputRef.value?.reload()
}

defineExpose({ reload })
</script>

<template>
  <div class="tres-sandbox">
    <TopBar v-if="topBar" />
    <SplitPane :layout="layout">
      <template #[editorSlotName]>
        <EditorContainer :editor-component="editor" />
      </template>
      <template #[outputSlotName]>
        <Output
          ref="outputRef"
          :editor-component="editor"
          :show-compile-output="props.showCompileOutput"
          :ssr="!!props.ssr"
        />
      </template>
    </SplitPane>
  </div>
</template>

<style scoped>
.tres-sandbox {
  --bg: #fff;
  --bg-soft: #f8f8f8;
  --border: #ddd;
  --text-light: #888;
  --font-code: 'JetBrains Mono', Monaco, Consolas, 'Courier New', monospace;
  --color-branding: #82dbc5;
  --color-branding-dark: #fbb03b;
  --header-height: 38px;

  height: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-soft);
}

@font-face {
	font-family: 'JetBrains Mono';
	src: url('/fonts/JetBrainsMono-Light.woff2') format('woff2');
	font-style: normal;
	font-display: swap;
}
@font-face {
	font-family: 'JetBrains Mono';
	src: url('/fonts/JetBrainsMono-Light.woff2') format('woff2');
	font-style: italic;
	font-display: swap;
}

.dark .tres-sandbox {
  --bg: #1a1a1a;
  --bg-soft: #242424;
  --border: #383838;
  --text-light: #aaa;
  --color-branding: #82dbc5;
  --color-branding-dark: #fbb03b;
}

:deep(button) {
  border: none;
  outline: none;
  cursor: pointer;
  margin: 0;
  background-color: transparent;
}
</style>
