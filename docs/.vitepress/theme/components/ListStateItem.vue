<script setup lang="ts">
import { until, useElementVisibility } from '@vueuse/core';
import { computed, effectScope, onMounted, ref } from 'vue';

const props = defineProps<{
  state: 0 | 1 | 2;
}>();

const el = ref<HTMLDivElement>();
const _state = ref(0);

function reset() {
  _state.value = 0;
  setTimeout(() => {
    _state.value = props.state;
  }, Math.round(Math.random() * 3000) + 400);
}

const liStyle = computed(() => {
  return {
    '--vp-c-brand-1':
      _state.value === 1 ? '#66ba1c' : _state.value === 2 ? 'rgba(248, 113, 113)' : 'rgba(250, 204, 21)',
    'list-style-type': 'none',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  } as any;
});

const scope = effectScope();

const visibility = scope.run(() => useElementVisibility(el));

onMounted(async () => {
  await until(visibility).toBe(true);

  scope.stop();
  reset();
});
</script>

<template>
  <li :style="liStyle">
    <div absolute transition duration-300 :class="_state ? 'flip' : ''" ref="el">
      <div i-carbon:circle-dash animate-spin animate-2s text-yellow4 />
    </div>
    <div absolute transition duration-300 :class="_state === 2 ? '' : 'flip'" ref="el">
      <div i-carbon:close-outline text-red4 />
    </div>
    <div absolute transition duration-300 :class="_state === 1 ? '' : 'flip'" ref="el">
      <div i-carbon:checkmark-outline class="text-$vp-c-brand-1" />
    </div>
    <div absolute transition duration-300 :class="_state === 3 ? '' : 'flip'" ref="el">
      <div i-carbon:chemistry text-blue4 />
    </div>
    <div pl-6>
      <slot />
    </div>
  </li>
</template>

<style>
.flip {
  transform: rotateY(90deg);
}
</style>
