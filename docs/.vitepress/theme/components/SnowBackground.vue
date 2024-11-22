<template>
  <div class="snow-container">
    <div
      v-for="(snowflake, index) in snowflakes"
      :key="index"
      class="snowflake"
      :style="{ left: `${snowflake.x}px` }"
      ref="snowflakeRefs"
    >
      ❄
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { animate } from 'motion';

const snowflakes = ref(
  Array(50)
    .fill()
    .map(() => ({
      x: Math.random() * window.innerWidth,
      y: -20,
    }))
);

const snowflakeRefs = ref([]);

onMounted(() => {
  snowflakeRefs.value.forEach((flake, index) => {
    animate(
      flake,
      {
        y: [0, window.innerHeight],
        x: [snowflakes.value[index].x, snowflakes.value[index].x + Math.random() * 100 - 50],
        rotate: Math.random() * 360,
      },
      {
        duration: 3000 + Math.random() * 3000,
        repeat: Infinity,
        easing: 'linear',
      }
    );
  });
});
</script>

<style scoped>
.snow-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 100;
}

.snowflake {
  position: absolute;
  color: white;
  font-size: 20px;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}
</style>
