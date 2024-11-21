---
aside: true
transmitted: true
transmittedFrom: 'https://antfu.me/posts/async-with-composition-api'
transmittedAuthor: 'Anthony Fu'
translated: true
---

# Vue Composition API 中的异步函数

::: tip
原文：[Async with Composition API](https://antfu.me/posts/async-with-composition-api) ，作者：[Anthony Fu](https://antfu.me/)
:::

在 Vue Composition API 中处理异步函数时，有一个主要的注意事项，我相信很多人都遇到过。我已经从某处了解到这一点，但每次我想要详细参考并与他人分享时，我都找不到相关的文档。所以，我打算写一篇详细的解释，并整理出可能的解决方案供大家参考。

-   [问题](https://antfu.me/posts/async-with-composition-api#the-problem)
-   [机制](https://antfu.me/posts/async-with-composition-api#the-mechanism)
-   [限制](https://antfu.me/posts/async-with-composition-api#the-limitation)
-   [解决方案](https://antfu.me/posts/async-with-composition-api#the-solutions)

## 问题[#](https://antfu.me/posts/async-with-composition-api#the-problem)

在使用异步 `setup()` 时，**你必须在第一个 `await` 语句之前使用 effect 和生命周期钩子。**（[详情](https://github.com/vuejs/rfcs/discussions/234)）

例如：

```ts
import { onMounted, onUnmounted, ref, watch } from 'vue';

export default defineAsyncComponent({
    async setup() {
        const counter = ref(0);

        watch(counter, () => console.log(counter.value));

        // 可以正常工作！
        onMounted(() => console.log('Mounted'));

        // await 语句
        await someAsyncFunction(); // <-----------

        // 不起作用！
        onUnmounted(() => console.log('Unmounted'));

        // 仍然有效，但在组件销毁后不会自动清理（内存泄漏！）
        watch(counter, () => console.log(counter.value * 2));
    },
});
```

在 `await` 语句之后，

以下函数将受到**限制**（不会自动清理）：

-   `watch` / `watchEffect`
-   `computed`
-   `effect`

以下函数将**不起作用**：

-   `onMounted` / `onUnmounted` / `onXXX`
-   `provide` / `inject`
-   `getCurrentInstance`
-   …

## 机制[#](https://antfu.me/posts/async-with-composition-api#the-mechanism)

让我们以 `onMounted` API 为例。我们知道，`onMounted` 是一个在当前组件挂载时注册监听器的钩子。注意，`onMounted`（以及其他 composition API）是**全局的**，我的意思是它可以在任何地方导入和调用——没有绑定到它的**本地上下文**。

```ts
// 本地：`onMounted` 是绑定到 `component` 的方法
component.onMounted(/* ... */);

// 全局：`onMounted` 可以在没有上下文的情况下调用
onMounted(/* ... */);
```

那么，`onMounted` 如何知道哪个组件正在挂载？

Vue 采用了一种有趣的方法来解决这个问题。它使用一个内部变量来记录当前的组件实例。以下是简化的代码：

当 Vue 挂载一个组件时，它会将实例存储在一个全局变量中。当在 setup 函数中调用钩子时，它会使用全局变量来获取当前的组件实例。

```js
let currentInstance = null;

// （伪代码）
export function mountComponent(component) {
    const instance = createComponent(component);

    // 保存之前的实例
    const prev = currentInstance;

    // 将实例设置为全局变量
    currentInstance = instance;

    // 在 `setup()` 内部调用的钩子将以 `currentInstance` 作为上下文
    component.setup();

    // 恢复之前的实例
    currentInstance = prev;
}
```

一个简化的 `onMounted` 实现可能是这样的：

```js
// （伪代码）
export function onMounted(fn) {
    if (!currentInstance) {
        warn(`"onMounted" 不能在组件 setup() 之外调用`);
        return;
    }
    // 将监听器绑定到当前实例
    currentInstance.onMounted(fn);
}
```

通过这种方法，只要 `onMounted` 在组件 `setup()` 内部调用，它就能够获取当前组件的实例。

## 限制[#](https://antfu.me/posts/async-with-composition-api#the-limitation)

到目前为止一切顺利，但异步函数有什么问题呢？

该实现基于 JavaScript 是**单线程**的这一事实。单线程确保以下语句将紧接着执行，换句话说，没有人可以在同一时间意外修改 `currentInstance`（即它是[原子的](https://stackoverflow.com/questions/52196678/what-are-atomic-operations-for-newbies)）。

```ts
currentInstance = instance;
component.setup();
currentInstance = prev;
```

当 `setup()` 是异步的时，情况就会改变。每当你 `await` 一个 promise 时，你可以认为引擎在这里暂停了工作并去做其他任务。如果我们 `await` 该函数，在这段时间内，多个组件的创建将不可预测地更改全局变量，最终导致混乱。

```ts
currentInstance = instance;
await component.setup(); // 原子性丧失
currentInstance = prev;
```

如果我们不使用 `await` 来检查实例，调用 `setup()` 函数将使其在第一个 `await` 语句之前完成任务，其余部分将在 `await` 语句解析后执行。

```ts
async function setup() {
    console.log(1);
    await someAsyncFunction();
    console.log(2);
}

console.log(3);
setup();
console.log(4);
// 输出：
3;
1;
4（等待中）;
2;
```

这意味着，Vue 无法从外部知道异步部分何时被调用，因此也无法将实例绑定到上下文。

## 解决方案[#](https://antfu.me/posts/async-with-composition-api#the-solutions)

这实际上是 JavaScript 本身的限制，除非我们在语言层面上有一些新的提案，否则我们必须接受它。

但为了绕过它，我为你收集了一些解决方案，可以根据你的需要进行选择。

### 记住注意事项并避免它[#](https://antfu.me/posts/async-with-composition-api#remember-the-caveat-and-avoid-it)

这当然是一个显而易见的“解决方案”。你可以尝试将 effect 和钩子移动到第一个 `await` 语句之前，并小心记住不要在那之后再使用它们。

幸运的是，如果你使用 ESLint，你可以启用 [`vue/no-watch-after-await`](https://eslint.vuejs.org/rules/no-watch-after-await.html) 和 [`vue/no-lifecycle-after-await`](https://eslint.vuejs.org/rules/no-lifecycle-after-await.html) 规则（它们在插件预设中默认启用），这样可以在你犯错时发出警告。

### 将异步函数包装为“响应式同步”[#](https://antfu.me/posts/async-with-composition-api#wrap-the-async-function-as-reactive-sync)

在某些情况下，你的逻辑可能依赖于异步获取的数据。在这种情况下，你可以考虑使用我在 VueDay 2021 上分享的[技巧](https://antfu.me/posts/composable-vue-vueday-2021#async-to-sync)将你的异步函数转换为同步响应式状态。

```ts
const data = await fetch('https://api.github.com/').then((r) => r.json());

const user = data.user;
const data = ref(null);

fetch('https://api.github.com/')
    .then((r) => r.json())
    .then((res) => (data.value = res));

const user = computed(() => data?.user);
```

这种方法使你的逻辑之间的“连接”首先得到解决，然后在异步函数解析并填充数据时进行响应式更新。

VueUse 还提供了一些更通用的实用工具：

#### [`useAsyncState`](https://vueuse.org/useAsyncState)[#](https://antfu.me/posts/async-with-composition-api#useasyncstate)

```ts
import { useAsyncState } from '@vueuse/core';

const { state, ready } = useAsyncState(async () => {
    const { data } = await axios.get('https://api.github.com/');
    return { data };
});

const user = computed(() => state?.user);
```

#### [`useFetch`](https://vueuse.org/useFetch)[#](https://antfu.me/posts/async-with-composition-api#usefetch)

```ts
import { useFetch } from '@vueuse/core';

const { data, isFetching, error } = useFetch('https://api.github.com/');

const user = computed(() => data?.user);
```

### 显式绑定实例[#](https://antfu.me/posts/async-with-composition-api#explicitly-bound-the-instance)

生命周期钩子实际上接受第二个参数来显式设置实例。

```ts
export default defineAsyncComponent({
    async setup() {
        // 在 `await` 之前获取并保存实例
        const instance = getCurrentInstance();

        await someAsyncFunction(); // <-----------

        onUnmounted(
            () => console.log('Unmounted'),
            instance // <--- 将实例传递给它
        );
    },
});
```

在 `await` 语句之后，以下函数将受到**限制**（不会自动释放）：

-   `watch` / `watchEffect`
-   `computed`
-   `effect`

以下函数将**无法工作**：

-   `onMounted` / `onUnmounted` / `onXXX`
-   `provide` / `inject`
-   `getCurrentInstance`
-   …

## 机制[#](https://antfu.me/posts/async-with-composition-api#the-mechanism)

让我们以 `onMounted` API 为例。众所周知，`onMounted` 是一个钩子，当当前组件挂载时注册一个监听器。注意，`onMounted`（以及其他组合 API）是**全局的**，我的意思是它可以在任何地方导入和调用——没有绑定到它的**本地上下文**。

```ts
// 本地：`onMounted` 是绑定到 `component` 的方法
component.onMounted(/* ... */);

// 全局：`onMounted` 可以在没有上下文的情况下调用
onMounted(/* ... */);
```

那么，`onMounted` 如何知道哪个组件正在挂载？

Vue 采用了一种有趣的方法来解决这个问题。它使用一个内部变量来记录当前的组件实例。以下是简化的代码：

当 Vue 挂载一个组件时，它将实例存储在一个全局变量中。当在 `setup` 函数内部调用钩子时，它将使用全局变量获取当前组件实例。

```js
let currentInstance = null;

// （伪代码）
export function mountComponent(component) {
    const instance = createComponent(component);

    // 保存之前的实例
    const prev = currentInstance;

    // 将实例设置为全局
    currentInstance = instance;

    // 在 `setup()` 内部调用的钩子将
    // 以 `currentInstance` 作为上下文
    component.setup();

    // 恢复之前的实例
    currentInstance = prev;
}
```

一个简化的 `onMounted` 实现可能是这样的：

```js
// （伪代码）
export function onMounted(fn) {
    if (!currentInstance) {
        warn(`"onMounted" 不能在组件 setup() 之外调用`);
        return;
    }

    // 将监听器绑定到当前实例
    currentInstance.onMounted(fn);
}
```

通过这种方法，只要 `onMounted` 在组件 `setup()` 内部调用，它就能够获取当前组件的实例。

## 限制[#](https://antfu.me/posts/async-with-composition-api#the-limitation)

到目前为止一切顺利，但异步函数有什么问题呢？

该实现基于 JavaScript 是**单线程**的这一事实。单线程确保以下语句将紧接着执行，换句话说，没有人可以在同一时间意外修改 `currentInstance`（即它是[原子的](https://stackoverflow.com/questions/52196678/what-are-atomic-operations-for-newbies)）。

```ts
currentInstance = instance;
component.setup();
currentInstance = prev;
```

当 `setup()` 是异步的时，情况就会改变。每当你 `await` 一个 promise 时，你可以认为引擎在这里暂停了工作并去做另一项任务。如果我们 `await` 该函数，在这段时间内，多个组件的创建将不可预测地更改全局变量，最终导致混乱。

```ts
currentInstance = instance;
await component.setup(); // 原子性丧失
currentInstance = prev;
```

如果我们不使用 `await` 来检查实例，调用 `setup()` 函数将使其在第一个 `await` 语句之前完成任务，其余部分将在 `await` 语句解析时执行。

```ts
async function setup() {
    console.log(1);
    await someAsyncFunction();
    console.log(2);
}

console.log(3);
setup();
console.log(4);
// 输出：
3;
1;
4(等待中);
2;
```

这意味着，Vue 无法知道异步部分何时会从外部调用，因此也无法将实例绑定到上下文。

## 解决方案[#](https://antfu.me/posts/async-with-composition-api#the-solutions)

这实际上是 JavaScript 本身的限制，除非我们在语言层面上有一些新的提案，否则我们必须接受它。

但为了绕过它，我收集了一些解决方案供你根据需要选择。

### 记住警告并避免它[#](https://antfu.me/posts/async-with-composition-api#remember-the-caveat-and-avoid-it)

这当然是一个显而易见的“解决方案”。你可以尝试将你的效果和钩子移动到第一个 `await` 语句之前，并小心不要在那之后再次使用它们。

幸运的是，如果你使用 ESLint，你可以启用 [`vue/no-watch-after-await`](https://eslint.vuejs.org/rules/no-watch-after-await.html) 和 [`vue/no-lifecycle-after-await`](https://eslint.vuejs.org/rules/no-lifecycle-after-await.html) 规则（它们在插件预设中默认启用），这样它可以在你犯错时警告你。

### 将异步函数包装为“响应式同步”[#](https://antfu.me/posts/async-with-composition-api#wrap-the-async-function-as-reactive-sync)

在某些情况下，你的逻辑可能依赖于异步获取的数据。在这种情况下，你可以考虑使用我在 VueDay 2021 上分享的[技巧](https://antfu.me/posts/composable-vue-vueday-2021#async-to-sync)将你的异步函数转换为同步响应式状态。

```ts
const data = await fetch('https://api.github.com/').then((r) => r.json());

const user = data.user;
const data = ref(null);

fetch('https://api.github.com/')
    .then((r) => r.json())
    .then((res) => (data.value = res));

const user = computed(() => data?.user);
```

这种方法使你的逻辑之间的“连接”首先解析，然后在异步函数解析并填充数据时进行响应式更新。

VueUse 还提供了一些更通用的实用工具：

#### [`useAsyncState`](https://vueuse.org/useAsyncState)[#](https://antfu.me/posts/async-with-composition-api#useasyncstate)

```ts
import { useAsyncState } from '@vueuse/core';

const { state, ready } = useAsyncState(async () => {
    const { data } = await axios.get('https://api.github.com/');
    return { data };
});

const user = computed(() => state?.user);
```

#### [`useFetch`](https://vueuse.org/useFetch)[#](https://antfu.me/posts/async-with-composition-api#usefetch)

```ts
import { useFetch } from '@vueuse/core';

const { data, isFetching, error } = useFetch('https://api.github.com/');

const user = computed(() => data?.user);
```

### 显式绑定实例[#](https://antfu.me/posts/async-with-composition-api#explicitly-bound-the-instance)

生命周期钩子实际上接受第二个参数来显式设置实例。

```ts
export default defineAsyncComponent({
    async setup() {
        // 在 `await` 之前获取并保存实例
        const instance = getCurrentInstance();

        await someAsyncFunction(); // <-----------

        onUnmounted(
            () => console.log('Unmounted'),
            instance // <--- 将实例传递给它
        );
    },
});
```

然而，缺点是这个解决方案**不适用于** `watch` / `watchEffect` / `computed` / `provide` / `inject`，因为它们不接受实例参数。

要使效果起作用，你可以使用即将推出的 Vue 3.2 中的 [`effectScope` API](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md)。

```ts
import { effectScope } from 'vue';

export default defineAsyncComponent({
    async setup() {
        // 在 `await` 之前创建作用域，这样它将绑定到实例
        const scope = effectScope();

        const data = await someAsyncFunction(); // <-----------

        scope.run(() => {
            /* 使用 `computed`、`watch` 等... */
        });

        // 生命周期钩子在这里不可用，
        // 你需要将其与前面的代码片段结合使用
        // 以使生命周期钩子和效果都能工作。
    },
});
```

### 编译时魔法! [#](https://antfu.me/posts/async-with-composition-api#compile-time-magic)

在最近的 [`<script setup>` 提案](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md)更新中，引入了一种新的[编译时魔法](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md#top-level-await)。

它的工作方式是在每个 `await` 语句之后注入一个脚本，以恢复当前实例状态。

```html
<script setup>
    const post = await fetch(`/api/post/1`).then((r) => r.json())
</script>
```

```ts
import { withAsyncContext } from 'vue';

export default {
    async setup() {
        let __temp, __restore;

        const post =
            (([__temp, __restore] = withAsyncContext(() => fetch(`/api/post/1`).then((r) => r.json()))),
            (__temp = await __temp),
            __restore(),
            __temp);

        // 当前实例上下文已保存
        // 例如，onMounted() 仍然可以工作。

        return { post };
    },
};
```

使用它时，异步函数在 `<script setup>` 中**将正常工作**。唯一的遗憾是它在 `<script setup>` 之外不起作用。
