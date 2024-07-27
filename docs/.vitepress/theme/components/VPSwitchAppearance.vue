<script lang="ts" setup>
import { inject, ref, watchPostEffect } from 'vue'
import { useData } from 'vitepress/dist/client/theme-default/composables/data.js'
const { isDark, theme } = useData()

const toggleAppearance = inject('toggle-appearance', () => {
  isDark.value = !isDark.value
})

const switchTitle = ref('')

watchPostEffect(() => {
  switchTitle.value = isDark.value
    ? theme.value.lightModeSwitchTitle || 'Switch to light theme'
    : theme.value.darkModeSwitchTitle || 'Switch to dark theme'
})
</script>

<template>
  <div
    class="i-meteocons:clear-day-fill w-1.8em h-1.8em cursor-pointer"
    v-if="!isDark"
    @click="toggleAppearance"></div>
  <div
    class="i-meteocons:clear-night-fill w-1.8em h-1.8em cursor-pointer"
    v-else
    @click="toggleAppearance"></div>
</template>
