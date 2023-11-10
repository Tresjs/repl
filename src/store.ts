import { version, reactive, watchEffect, watch } from 'vue'
import { version as tresVersion } from '@tresjs/core/package.json'
import { version as cientosVersion } from '@tresjs/cientos/package.json'

import * as defaultCompiler from 'vue/compiler-sfc'
import type {
  SFCScriptCompileOptions,
  SFCAsyncStyleCompileOptions,
  SFCTemplateCompileOptions,
} from 'vue/compiler-sfc'
import type { editor } from 'monaco-editor-core'
import { compileFile } from './transform'
import { utoa, atou } from './utils'
import type { OutputModes } from './output/types'

const defaultMainFile = 'src/TresApp.vue'

export const importMapFile = 'import-map.json'
export const tsconfigFile = 'tsconfig.json'

const welcomeCode = `
<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three';
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';

const gl = {
  clearColor: '#82DBC5',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
};
</script>

<template>
  <TresCanvas v-bind="gl">
    <TresPerspectiveCamera :position="[9, 9, 9]" />
    <OrbitControls />
    <TresMesh :position="[-2, 2, 0]" :rotation="[0, Math.PI, 0]">
      <TresConeGeometry :args="[1, 1.5, 3]" />
      <TresMeshToonMaterial color="#82DBC5" />
    </TresMesh>
    <TresMesh :position="[0, 0, 0]" cast-shadow>
      <TresBoxGeometry :args="[1.5, 1.5, 1.5]" />
      <TresMeshToonMaterial color="#4F4F4F" />
    </TresMesh>
    <TresMesh :position="[2, -2, 0]">
      <TresSphereGeometry />
      <TresMeshToonMaterial color="#FBB03B" />
    </TresMesh>
    <TresDirectionalLight :position="[0, 2, 4]" :intensity="1.2" cast-shadow />
  </TresCanvas>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
#app {
  height: 100%;
  width: 100%;
  background-color: #000;
}
</style>
`.trim()

const tsconfig = {
  compilerOptions: {
    allowJs: true,
    checkJs: true,
    jsx: 'Preserve',
    target: 'ESNext',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    allowImportingTsExtensions: true,
    types: ['three'],
  },
  vueCompilerOptions: {
    target: 3.3,
  },
}

export class File {
  filename: string
  code: string
  hidden: boolean
  compiled = {
    js: '',
    css: '',
    ssr: '',
  }

  editorViewState: editor.ICodeEditorViewState | null = null

  constructor(filename: string, code = '', hidden = false) {
    this.filename = filename
    this.code = code
    this.hidden = hidden
  }

  get language() {
    if (this.filename.endsWith('.vue')) {
      return 'vue'
    }
    if (this.filename.endsWith('.html')) {
      return 'html'
    }
    if (this.filename.endsWith('.css')) {
      return 'css'
    }
    if (this.filename.endsWith('.ts')) {
      return 'typescript'
    }
    return 'javascript'
  }
}

export interface StoreState {
  mainFile: string
  files: Record<string, File>
  activeFile: File
  errors: (string | Error)[]
  vueRuntimeURL: string
  vueServerRendererURL: string
  typescriptVersion: string
  /** @deprecated use `locale` instead */
  typescriptLocale?: string | undefined
  locale?: string | undefined
  // used to force reset the sandbox
  resetFlip: boolean
  /** \{ dependencyName: version \} */
  dependencyVersion?: Record<string, string>
}

export interface SFCOptions {
  script?: Partial<SFCScriptCompileOptions>
  style?: Partial<SFCAsyncStyleCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
}

export interface Store {
  state: StoreState
  options?: SFCOptions
  compiler: typeof defaultCompiler
  vueVersion?: string
  init: () => void
  setActive: (filename: string) => void
  addFile: (filename: string | File) => void
  deleteFile: (filename: string) => void
  renameFile: (oldFilename: string, newFilename: string) => void
  getImportMap: () => any
  getTsConfig?: () => any
  reloadLanguageTools?: undefined | (() => void)
  initialShowOutput: boolean
  initialOutputMode: OutputModes
}

export interface StoreOptions {
  serializedState?: string
  showOutput?: boolean
  // loose type to allow getting from the URL without inducing a typing error
  outputMode?: OutputModes | string
  defaultVueRuntimeURL?: string
  defaultVueServerRendererURL?: string
  defaultTresCoreURL?: string
  defaultTresCientosURL?: string
  defaultTweakpanesURL?: string
  defaultThreeURL?: string
  defaultVueUseURL?: string
  defaultVueUseSharedURL?: string
  defaultVueDemiURL?: string
}

export class ReplStore implements Store {
  state: StoreState
  compiler = defaultCompiler
  vueVersion?: string
  tresVersion?: string
  options?: SFCOptions
  initialShowOutput: boolean
  initialOutputMode: OutputModes
  reloadLanguageTools: undefined | (() => void)

  private defaultVueRuntimeURL: string
  private defaultVueServerRendererURL: string
  private pendingCompiler: Promise<any> | null = null
  private defaultTresCoreURL: string
  private defaultTresCientosURL: string
  private defaultTweakpanesURL: string
  private defaultThreeURL: string
  private defaultVueUseURL: string
  private defaultVueUseSharedURL: string
  private defaultVueDemiURL: string

  constructor({
    serializedState = '',
    defaultVueRuntimeURL = `https://cdn.jsdelivr.net/npm/@vue/runtime-dom@${version}/dist/runtime-dom.esm-browser.js`,
    defaultVueServerRendererURL = `https://cdn.jsdelivr.net/npm/@vue/server-renderer@${version}/dist/server-renderer.esm-browser.js`,
    defaultTresCoreURL = `https://cdn.jsdelivr.net/npm/@tresjs/core@${tresVersion}/dist/tres.js`,
    defaultTresCientosURL = `https://cdn.jsdelivr.net/npm/@tresjs/cientos@${cientosVersion}/dist/trescientos.js`,
    defaultTweakpanesURL = 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js',
    defaultThreeURL = 'https://cdn.jsdelivr.net/npm/three@0.158.0/+esm',
    defaultVueUseURL = 'https://cdn.jsdelivr.net/npm/@vueuse/core@10.5.0/index.mjs',
    defaultVueUseSharedURL = 'https://cdn.jsdelivr.net/npm/@vueuse/shared@10.5.0/index.mjs',
    defaultVueDemiURL = 'https://cdn.jsdelivr.net/npm/vue-demi@0.14.6/lib/index.mjs',
    showOutput = false,
    outputMode = 'preview',
  }: StoreOptions = {}) {
    const files: StoreState['files'] = {}

    if (serializedState) {
      const saved = JSON.parse(atou(serializedState))
      for (const filename in saved) {
        setFile(files, filename, saved[filename])
      }
    }
    else {
      setFile(files, defaultMainFile, welcomeCode)
    }

    this.defaultVueRuntimeURL = defaultVueRuntimeURL
    this.defaultVueServerRendererURL = defaultVueServerRendererURL
    this.defaultTresCoreURL = defaultTresCoreURL
    this.defaultTresCientosURL = defaultTresCientosURL
    this.defaultTweakpanesURL = defaultTweakpanesURL
    this.defaultThreeURL = defaultThreeURL
    this.defaultVueUseURL = defaultVueUseURL
    this.defaultVueUseSharedURL = defaultVueUseSharedURL
    this.defaultVueDemiURL = defaultVueDemiURL
    this.initialShowOutput = showOutput
    this.initialOutputMode = outputMode as OutputModes

    let mainFile = defaultMainFile
    if (!files[mainFile]) {
      mainFile = Object.keys(files)[0]
    }
    this.state = reactive({
      mainFile,
      files,
      activeFile: files[mainFile],
      errors: [],
      vueRuntimeURL: this.defaultVueRuntimeURL,
      vueServerRendererURL: this.defaultVueServerRendererURL,
      typescriptVersion: 'latest',
      typescriptLocale: undefined,
      resetFlip: true,
      dependencyVersion: {
        '@types/three': '0.158.1',
      },
    })

    this.initImportMap()
    this.initTsConfig()
  }

  // don't start compiling until the options are set
  init() {
    watchEffect(() =>
      compileFile(this, this.state.activeFile).then(
        errs => (this.state.errors = errs),
      ),
    )

    watch(
      () => [
        this.state.files[tsconfigFile]?.code,
        this.state.typescriptVersion,
        this.state.typescriptLocale,
        this.state.locale,
        this.state.dependencyVersion,
      ],
      () => this.reloadLanguageTools?.(),
      { deep: true },
    )

    this.state.errors = []
    for (const file in this.state.files) {
      if (file !== defaultMainFile) {
        compileFile(this, this.state.files[file]).then(errs =>
          this.state.errors.push(...errs),
        )
      }
    }
  }

  private initTsConfig() {
    if (!this.state.files[tsconfigFile]) {
      this.setTsConfig(tsconfig)
    }
  }

  setTsConfig(config: any) {
    this.state.files[tsconfigFile] = new File(
      tsconfigFile,
      JSON.stringify(config, undefined, 2),
    )
  }

  getTsConfig() {
    try {
      return JSON.parse(this.state.files[tsconfigFile].code)
    }
    catch {
      return {}
    }
  }

  setActive(filename: string) {
    this.state.activeFile = this.state.files[filename]
  }

  addFile(fileOrFilename: string | File): void {
    const file
      = typeof fileOrFilename === 'string'
        ? new File(fileOrFilename)
        : fileOrFilename
    this.state.files[file.filename] = file
    if (!file.hidden) this.setActive(file.filename)
  }

  deleteFile(filename: string) {
    if (
      confirm(`Are you sure you want to delete ${stripSrcPrefix(filename)}?`)
    ) {
      if (this.state.activeFile.filename === filename) {
        this.state.activeFile = this.state.files[this.state.mainFile]
      }
      delete this.state.files[filename]
    }
  }

  renameFile(oldFilename: string, newFilename: string) {
    const { files } = this.state
    const file = files[oldFilename]

    if (!file) {
      this.state.errors = [`Could not rename "${oldFilename}", file not found`]
      return
    }

    if (!newFilename || oldFilename === newFilename) {
      this.state.errors = [`Cannot rename "${oldFilename}" to "${newFilename}"`]
      return
    }

    file.filename = newFilename

    const newFiles: Record<string, File> = {}

    // Preserve iteration order for files
    for (const name in files) {
      if (name === oldFilename) {
        newFiles[newFilename] = file
      }
      else {
        newFiles[name] = files[name]
      }
    }

    this.state.files = newFiles

    if (this.state.mainFile === oldFilename) {
      this.state.mainFile = newFilename
    }

    compileFile(this, file).then(errs => (this.state.errors = errs))
  }

  serialize() {
    const files = this.getFiles()
    const importMap = files[importMapFile]
    if (importMap) {
      const { imports } = JSON.parse(importMap)
      if (imports['vue'] === this.defaultVueRuntimeURL) {
        delete imports['vue']
      }
      if (imports['vue/server-renderer'] === this.defaultVueServerRendererURL) {
        delete imports['vue/server-renderer']
      }
      if (!Object.keys(imports).length) {
        delete files[importMapFile]
      }
      else {
        files[importMapFile] = JSON.stringify({ imports }, null, 2)
      }
    }
    return `#${utoa(JSON.stringify(files))}`
  }

  getFiles() {
    const exported: Record<string, string> = {}
    for (const filename in this.state.files) {
      const normalized
        = filename === importMapFile ? filename : stripSrcPrefix(filename)
      exported[normalized] = this.state.files[filename].code
    }
    return exported
  }

  async setFiles(newFiles: Record<string, string>, mainFile = defaultMainFile) {
    const files: Record<string, File> = {}
    if (mainFile === defaultMainFile && !newFiles[mainFile]) {
      setFile(files, mainFile, welcomeCode)
    }
    for (const filename in newFiles) {
      setFile(files, filename, newFiles[filename])
    }
    this.state.errors = []
    for (const file in files) {
      this.state.errors.push(...(await compileFile(this, files[file])))
    }
    this.state.mainFile = mainFile
    this.state.files = files
    this.initImportMap()
    this.setActive(mainFile)
    this.forceSandboxReset()
  }

  private forceSandboxReset() {
    this.state.resetFlip = !this.state.resetFlip
  }

  private initImportMap() {
    const map = this.state.files[importMapFile]
    if (!map) {
      this.state.files[importMapFile] = new File(
        importMapFile,
        JSON.stringify(
          {
            imports: {
              vue: this.defaultVueRuntimeURL,
              'vue/server-renderer': this.defaultVueServerRendererURL,
              '@tresjs/core': this.defaultTresCoreURL,
              '@tresjs/cientos': this.defaultTresCientosURL,
              tweakpane: this.defaultTweakpanesURL,
              three: this.defaultThreeURL,
              '@vueuse/core': this.defaultVueUseURL,
              '@vueuse/shared': this.defaultVueUseSharedURL,
              'vue-demi': this.defaultVueDemiURL,
            },
          },
          null,
          2,
        ),
      )
    }
    else {
      try {
        const json = JSON.parse(map.code)
        if (!json.imports.vue) {
          json.imports.vue = this.defaultVueRuntimeURL
        }
        else {
          json.imports.vue = fixURL(json.imports.vue)
        }
        if (!json.imports['vue/server-renderer']) {
          json.imports['vue/server-renderer'] = this.defaultVueServerRendererURL
        }
        else {
          json.imports['vue/server-renderer'] = fixURL(
            json.imports['vue/server-renderer'],
          )
        }
        map.code = JSON.stringify(json, null, 2)
      }
      catch (e) {}
    }
  }

  getImportMap() {
    try {
      return JSON.parse(this.state.files[importMapFile].code)
    }
    catch (e) {
      this.state.errors = [
        `Syntax error in import-map.json: ${(e as Error).message}`,
      ]
      return {}
    }
  }

  setImportMap(map: {
    imports: Record<string, string>
    scopes?: Record<string, Record<string, string>>
  }) {
    this.state.files[importMapFile]!.code = JSON.stringify(map, null, 2)
  }

  setTypeScriptVersion(version: string) {
    this.state.typescriptVersion = version
    console.info(`[@vue/repl] Now using TypeScript version: ${version}`)
  }

  async setVueVersion(version: string) {
    this.vueVersion = version
    const compilerUrl = `https://cdn.jsdelivr.net/npm/@vue/compiler-sfc@${version}/dist/compiler-sfc.esm-browser.js`
    const runtimeUrl = `https://cdn.jsdelivr.net/npm/@vue/runtime-dom@${version}/dist/runtime-dom.esm-browser.js`
    const ssrUrl = `https://cdn.jsdelivr.net/npm/@vue/server-renderer@${version}/dist/server-renderer.esm-browser.js`
    this.pendingCompiler = import(/* @vite-ignore */ compilerUrl)
    this.compiler = await this.pendingCompiler
    this.pendingCompiler = null
    this.state.vueRuntimeURL = runtimeUrl
    this.state.vueServerRendererURL = ssrUrl
    const importMap = this.getImportMap()
    const imports = importMap.imports || (importMap.imports = {})
    imports.vue = runtimeUrl
    imports['vue/server-renderer'] = ssrUrl
    this.setImportMap(importMap)
    this.forceSandboxReset()
    this.reloadLanguageTools?.()
    console.info(`[@vue/repl] Now using Vue version: ${version}`)
  }

  resetVueVersion() {
    this.vueVersion = undefined
    this.compiler = defaultCompiler
    this.state.vueRuntimeURL = this.defaultVueRuntimeURL
    this.state.vueServerRendererURL = this.defaultVueServerRendererURL
    const importMap = this.getImportMap()
    const imports = importMap.imports || (importMap.imports = {})
    imports.vue = this.defaultVueRuntimeURL
    imports['vue/server-renderer'] = this.defaultVueServerRendererURL
    this.setImportMap(importMap)
    this.forceSandboxReset()
    console.info('[@vue/repl] Now using default Vue version')
  }
}

function setFile(
  files: Record<string, File>,
  filename: string,
  content: string,
) {
  // prefix user files with src/
  // for cleaner Volar path completion when using Monaco editor
  const normalized
    = filename !== importMapFile
    && filename !== tsconfigFile
    && !filename.startsWith('src/')
      ? `src/${filename}`
      : filename
  files[normalized] = new File(normalized, content)
}

function fixURL(url: string) {
  return url.replace('https://sfc.vuejs', 'https://play.vuejs')
}

export function stripSrcPrefix(file: string) {
  return file.replace(/^src\//, '')
}
