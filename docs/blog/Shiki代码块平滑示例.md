# 使用 Shiki 平滑动画代码块

::: tip
Shiki 是一个基于 TextMate 语法和主题的美丽而强大的语法高亮显示器，与 VS Code 的语法高亮显示相同。为几乎所有主流编程语言提供非常准确和快速的语法突出显示。

[Shiki 官网](https://shiki.matsu.io/)

---

Shiki Magic Move 是一个低级的代码块动画库，和使用 Shiki 作为语法高亮器。您通常希望将其与 Slidev 这样的高级集成一起使用。

[Shiki Magic Move 官网](https://shiki-magic-move.netlify.app/)
:::

切换 `Options.vue` 和 `Composition.ts` 两个代码块，查看平滑动画效果。

:::magic-move

```vue [Options.vue]
<script>
import { defineComponent } from 'vue';

export default defineComponent({
    data: () => ({
        count: 1,
    }),
    computed: {
        double() {
            return this.count * 2;
        },
    },
});
</script>

<template>
    <p class="greeting">{{ count }} * 2 = {{ doubled }}</p>
</template>

<style>
.greeting {
    color: red;
    font-weight: bold;
}
</style>
```

```vue [Composition.ts]
<script setup>
import { computed, ref } from 'vue';

const count = ref(1);
const double = computed(() => count.value * 2);
</script>

<template>
    <p class="greeting">{{ count }} = {{ doubled / 2 }}</p>
</template>

<style>
.greeting {
    color: red;
    font-weight: bold;
}
</style>
```

:::
