<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)

async function copyLink(e: MouseEvent) {
  if (e.metaKey) {
    // hidden logic for going to local debug from play.vuejs.org
    window.location.href = `http://localhost:5173/${window.location.hash}`
    return
  }
  await navigator.clipboard.writeText(location.href)
  alert('Sharable URL has been copied to clipboard.')
}
</script>

<template>
  <header class="w-full font-sans">
    <div class=" flex mx-auto justify-between py-2 px-4">
      <div class="flex items-baseline">
        <img
          class="h-5 mr-4"
          src="/logo.svg"
          alt=""
        >
        <h1 class="dark:text-light text-sm">
          Playground
        </h1>
      </div>
      <ul class="flex items-center gap-4">
        <li>
          <button
            title="Toggle dark mode"
            class="toggle-dark"
            @click="toggleDark()"
          >
            <i
              v-if="isDark"
              class="i-carbon-sun text-white"
            />
            <i
              v-else
              class="i-carbon-moon text-dark"
            />
          </button>
        </li>
        <li>
          <button
            title="Copy sharable URL"
            @click="copyLink"
          >
            <i class="i-carbon-share dark:text-light" />
          </button>
        </li>
        <li>
          <a
            href="https://docs.tresjs.org/"
            target="_blank"
            class="i-carbon-document dark:text-light"
          />
        </li>
        <li>
          <a
            href="https://discord.gg/V8ZPvGHSQd"
            target="_blank"
            class="i-carbon-logo-discord dark:text-light"
          />
        </li>
      </ul>
    </div>
  </header>
</template>