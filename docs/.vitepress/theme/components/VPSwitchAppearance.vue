<script lang="ts" setup>
import { inject, ref, watchPostEffect } from 'vue';
import { useData } from 'vitepress/dist/client/theme-default/composables/data.js';
const { isDark, theme } = useData();

const toggleAppearance = inject('toggle-appearance', () => {
  isDark.value = !isDark.value;
});

const switchTitle = ref('');

watchPostEffect(() => {
  switchTitle.value = isDark.value
    ? theme.value.lightModeSwitchTitle || '切换到亮色模式'
    : theme.value.darkModeSwitchTitle || '切换到暗色模式';
});
</script>

<template>
  <transition name="fade" mode="out-in">
    <div class="i-fluent-emoji:sun text-xl cursor-pointer" v-if="!isDark" @click="toggleAppearance"></div>
    <div class="i-fluent-emoji:first-quarter-moon-face text-xl cursor-pointer" v-else @click="toggleAppearance"></div>
  </transition>
</template>
