import { createApp, h, watchEffect } from 'vue'
import { templateCompilerOptions } from '@tresjs/core'
import { Repl, ReplStore } from '../src'
import MonacoEditor from '../src/editor/MonacoEditor.vue'

// import CodeMirrorEditor from '../src/editor/CodeMirrorEditor.vue'
import type { EditorComponentType } from '../src/editor/types'
;

(window as any).process = { env: {} }

const isCustomElement = templateCompilerOptions.template.compilerOptions.isCustomElement

const App = {
  setup() {
    const query = new URLSearchParams(location.search)
    const store = ((window as any).store = new ReplStore({
      serializedState: location.hash.slice(1),
      showOutput: query.has('so'),
      outputMode: query.get('om') || 'preview',
      defaultVueRuntimeURL: import.meta.env.PROD
        ? undefined
        : `${location.origin}/src/vue-dev-proxy`,
      defaultVueServerRendererURL: import.meta.env.PROD
        ? undefined
        : `${location.origin}/src/vue-server-renderer-dev-proxy`,
    }))

    watchEffect(() => history.replaceState({}, '', store.serialize()))

    // setTimeout(() => {
    // store.setFiles(
    //   {
    //     'index.html': '<h1>yo</h1>',
    //     'main.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //     'foo.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //     'bar.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //     'baz.js': 'document.body.innerHTML = "<h1>hello</h1>"'
    //   },
    //   'index.html'
    // )
    // }, 1000);

    // store.setVueVersion('3.2.8')

    const whitelist = [
      'TresCanvas',
      'TresLeches',
      'TresScene',
    ]
    return () =>
      h(Repl, {
        store,
        theme: 'dark',
        editor: MonacoEditor as any as EditorComponentType,
        // layout: 'vertical',
        ssr: false,
        sfcOptions: {
          script: {
            // inlineTemplate: false
          },
          template: {
            compilerOptions: {
              isCustomElement: (tag: string) => 
                tag.startsWith('Tres') && !whitelist.includes(tag) || tag === 'primitive',
            },
          },
        },
        // showCompileOutput: false,
        // showImportMap: false
      })
  },
}

createApp(App).mount('#app')
