<script lang="ts" setup>
import {
  onMounted,
  onBeforeUnmount,
  ref,
  shallowRef,
  nextTick,
  inject,
  watch,
  computed,
  type Ref,
} from 'vue'
import * as monaco from 'monaco-editor-core'
import { initMonaco } from './env'
import { getOrCreateModel } from './utils'
import { loadGrammars, loadTheme } from 'monaco-volar'
import { Store } from '../store'
import type { PreviewMode } from '../editor/types'

const props = withDefaults(
  defineProps<{
    filename: string
    value?: string
    readonly?: boolean
    mode?: PreviewMode
  }>(),
  {
    readonly: false,
  }
)

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

const containerRef = ref<HTMLDivElement>()
const ready = ref(false)
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor>()
const store = inject<Store>('store')!

initMonaco(store)

const lang = computed(() => (props.mode === 'css' ? 'css' : 'javascript'))

const replTheme = inject<Ref<'dark' | 'light'>>('theme')!
onMounted(async () => {
  /* const theme = await loadTheme(monaco.editor) */
  ready.value = true
  await nextTick()

  if (!containerRef.value) {
    throw new Error('Cannot find containerRef')
  }

  monaco.editor.defineTheme('tres-dark',{
  "base": "vs-dark",
  "inherit": true,
  "rules": [
    {
      "background": "1a1a1a",
      "token": ""
    },
    {
      "foreground": "6272a4",
      "token": "comment"
    },
    {
      "foreground": "f1fa8c",
      "token": "string"
    },
    {
      "foreground": "bd93f9",
      "token": "constant.numeric"
    },
    {
      "foreground": "bd93f9",
      "token": "constant.language"
    },
    {
      "foreground": "bd93f9",
      "token": "constant.character"
    },
    {
      "foreground": "bd93f9",
      "token": "constant.other"
    },
    {
      "foreground": "ffb86c",
      "token": "variable.other.readwrite.instance"
    },
    {
      "foreground": "ff79c6",
      "token": "constant.character.escaped"
    },
    {
      "foreground": "ff79c6",
      "token": "constant.character.escape"
    },
    {
      "foreground": "ff79c6",
      "token": "string source"
    },
    {
      "foreground": "ff79c6",
      "token": "string source.ruby"
    },
    {
      "foreground": "ff79c6",
      "token": "keyword"
    },
    {
      "foreground": "ff79c6",
      "token": "storage"
    },
    {
      "foreground": "8be9fd",
      "fontStyle": "italic",
      "token": "storage.type"
    },
    {
      "foreground": "50fa7b",
      "fontStyle": "underline",
      "token": "entity.name.class"
    },
    {
      "foreground": "50fa7b",
      "fontStyle": "italic underline",
      "token": "entity.other.inherited-class"
    },
    {
      "foreground": "50fa7b",
      "token": "entity.name.function"
    },
    {
      "foreground": "ffb86c",
      "fontStyle": "italic",
      "token": "variable.parameter"
    },
    {
      "foreground": "ff79c6",
      "token": "entity.name.tag"
    },
    {
      "foreground": "50fa7b",
      "token": "entity.other.attribute-name"
    },
    {
      "foreground": "8be9fd",
      "token": "support.function"
    },
    {
      "foreground": "6be5fd",
      "token": "support.constant"
    },
    {
      "foreground": "66d9ef",
      "fontStyle": " italic",
      "token": "support.type"
    },
    {
      "foreground": "66d9ef",
      "fontStyle": " italic",
      "token": "support.class"
    },
    {
      "foreground": "82DBC5",
      "background": "ff79c6",
      "token": "invalid"
    },
    {
      "foreground": "82DBC5",
      "background": "bd93f9",
      "token": "invalid.deprecated"
    },
    {
      "foreground": "cfcfc2",
      "token": "meta.structure.dictionary.json string.quoted.double.json"
    },
    {
      "foreground": "6272a4",
      "token": "meta.diff"
    },
    {
      "foreground": "6272a4",
      "token": "meta.diff.header"
    },
    {
      "foreground": "ff79c6",
      "token": "markup.deleted"
    },
    {
      "foreground": "50fa7b",
      "token": "markup.inserted"
    },
    {
      "foreground": "e6db74",
      "token": "markup.changed"
    },
    {
      "foreground": "bd93f9",
      "token": "constant.numeric.line-number.find-in-files - match"
    },
    {
      "foreground": "e6db74",
      "token": "entity.name.filename"
    },
    {
      "foreground": "f83333",
      "token": "message.error"
    },
    {
      "foreground": "eeeeee",
      "token": "punctuation.definition.string.begin.json - meta.structure.dictionary.value.json"
    },
    {
      "foreground": "eeeeee",
      "token": "punctuation.definition.string.end.json - meta.structure.dictionary.value.json"
    },
    {
      "foreground": "8be9fd",
      "token": "meta.structure.dictionary.json string.quoted.double.json"
    },
    {
      "foreground": "f1fa8c",
      "token": "meta.structure.dictionary.value.json string.quoted.double.json"
    },
    {
      "foreground": "50fa7b",
      "token": "meta meta meta meta meta meta meta.structure.dictionary.value string"
    },
    {
      "foreground": "ffb86c",
      "token": "meta meta meta meta meta meta.structure.dictionary.value string"
    },
    {
      "foreground": "ff79c6",
      "token": "meta meta meta meta meta.structure.dictionary.value string"
    },
    {
      "foreground": "bd93f9",
      "token": "meta meta meta meta.structure.dictionary.value string"
    },
    {
      "foreground": "50fa7b",
      "token": "meta meta meta.structure.dictionary.value string"
    },
    {
      "foreground": "ffb86c",
      "token": "meta meta.structure.dictionary.value string"
    }
  ],
  "colors": {
    "editor.foreground": "#f8f8f2",
    "editor.background": "#1a1a1a",
    "editor.selectionBackground": "#44475a",
    "editor.lineHighlightBackground": "#44475a",
    "editorCursor.foreground": "#f8f8f0",
    "editorWhitespace.foreground": "#3B3A32",
    "editorIndentGuide.activeBackground": "#9D550FB0",
    "editor.selectionHighlightBorder": "#222218"
  }
})

  const editorInstance = monaco.editor.create(containerRef.value, {
    ...(props.readonly
      ? { value: props.value, language: lang.value }
      : { model: null }),
    fontSize: 13,
    theme: replTheme.value === 'light' ? 'vs-light' : 'tres-dark',
    readOnly: props.readonly,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false,
    },
    inlineSuggest: {
      enabled: false,
    },
    'semanticHighlighting.enabled': true,
    fixedOverflowWidgets: true,
  })
  editor.value = editorInstance

  // Support for semantic highlighting
  const t = (editorInstance as any)._themeService._theme
  t.getTokenStyleMetadata = (
    type: string,
    modifiers: string[],
    _language: string
  ) => {
    const _readonly = modifiers.includes('readonly')
    switch (type) {
      case 'function':
      case 'method':
        return { foreground: 12 }
      case 'class':
        return { foreground: 11 }
      case 'variable':
      case 'property':
        return { foreground: _readonly ? 21 : 9 }
      default:
        return { foreground: 0 }
    }
  }

  watch(
    () => props.value,
    (value) => {
      if (editorInstance.getValue() === value) return
      editorInstance.setValue(value || '')
    },
    { immediate: true }
  )

  watch(lang, (lang) =>
    monaco.editor.setModelLanguage(editorInstance.getModel()!, lang)
  )

  if (!props.readonly) {
    watch(
      () => props.filename,
      (_, oldFilename) => {
        if (!editorInstance) return
        const file = store.state.files[props.filename]
        if (!file) return null
        const model = getOrCreateModel(
          monaco.Uri.parse(`file:///${props.filename}`),
          file.language,
          file.code
        )

        const oldFile = oldFilename ? store.state.files[oldFilename] : null
        if (oldFile) {
          oldFile.editorViewState = editorInstance.saveViewState()
        }

        editorInstance.setModel(model)

        if (file.editorViewState) {
          editorInstance.restoreViewState(file.editorViewState)
          editorInstance.focus()
        }
      },
      { immediate: true }
    )
  }

  await loadGrammars(monaco, editorInstance)

  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    // ignore save event
  })

  editorInstance.onDidChangeModelContent(() => {
    emit('change', editorInstance.getValue())
  })

  // update theme
  watch(replTheme, (n) => {
    editorInstance.updateOptions({
      theme: n === 'light' ? theme.light : theme.dark,
    })
  })
})

onBeforeUnmount(() => {
  editor.value?.dispose()
})
</script>

<template>
  <div class="editor" ref="containerRef"></div>
</template>

<style>
.editor {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.monaco-editor, .monaco-diff-editor {
  font-family: 'JetBrains Mono', Monaco, Consolas, 'Courier New',
    monospace !important;
}
</style>
