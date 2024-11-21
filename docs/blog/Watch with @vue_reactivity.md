---
aside: true
transmitted: true
transmittedFrom: 'https://antfu.me/posts/watch-with-reactivity'
transmittedAuthor: 'Anthony Fu'
translated: true
---

# 使用 @vue/reactivity 的 Watch

::: tip
原文：[Async with Composition API](https://antfu.me/posts/watch-with-reactivity) ，作者：[Anthony Fu](https://antfu.me/)
:::

-   理解 @vue/reactivity
    -   [计算属性](https://antfu.me/posts/watch-with-reactivity#computed)
-   [Effect](https://antfu.me/posts/watch-with-reactivity#effect)
-   自己实现一个 watch
    -   [基础](https://antfu.me/posts/watch-with-reactivity#the-basic)
    -   [监听 Ref](https://antfu.me/posts/watch-with-reactivity#watch-for-ref)
    -   [深度监听](https://antfu.me/posts/watch-with-reactivity#watch-deeply)
-   [生命周期](https://antfu.me/posts/watch-with-reactivity#lifecycles)
-   [总结](https://antfu.me/posts/watch-with-reactivity#take-away)

[正如你可能知道的](https://twitter.com/antfu7/status/1298667080804233221)，我在 Vue 3 中最兴奋的事情是 [Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html) 和 [响应式系统](https://v3.vuejs.org/guide/reactivity.html)。通过 Composition API，我们可以在组件甚至应用之间重用逻辑和状态。更棒的是，底层的响应式系统与 Vue 解耦，这意味着你几乎可以在任何地方使用它，甚至不需要 UI。

以下是一些在 Vue 之外使用响应式系统的概念验证：

-   [`@vue/lit`](https://github.com/yyx990803/vue-lit) 是由 Evan 编写的一个最小框架，结合了 [`@vue/reactivity`](https://github.com/vuejs/core/tree/main/packages/reactivity) 和 [`lit-html`](https://lit-html.polymer-project.org/)。它可以直接在浏览器中运行，体验几乎与 Vue Composition API 相同。
-   [`ReactiVue`](https://github.com/antfu/reactivue) 将 Vue Composition API 移植到 React。它还提供了 Vue 风格的 React 生命周期。

此外，你甚至可以在这些框架中使用 Vue 的库。在 [`ReactiVue`](https://github.com/antfu/reactivue) 中测试了 [`VueUse`](https://github.com/antfu/vueuse) 和 [`pinia`](https://github.com/posva/pinia)，它们都能正常工作。你可以在[这里](https://github.com/antfu/reactivue#using-vues-libraries)找到更多详细信息和示例。

我还在探索 Vue 响应式系统在其他场景中的更多可能性，例如在一个名为 `tive` 的项目中实现[响应式文件系统](https://twitter.com/antfu7/status/1305313110903779330?s=20)。目前这是一个 WIP 私有仓库，但请保持关注，我会有更多内容发布 😉！

## 理解 `@vue/reactivity`[#](https://antfu.me/posts/watch-with-reactivity#understanding-vue-reactivity)

`ref()` 或 `reactive()` 返回的“响应式对象”实际上是 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)。这些代理会触发一些操作来跟踪属性的访问或写入变化。

一个简化的例子：

```ts
function reactive(target) {
    return new Proxy(target, {
        get(target, prop, receiver) {
            track(target, prop);
            return Reflect.get(...arguments); // 获取原始数据
        },
        set(target, key, value, receiver) {
            trigger(target, key);
            return Reflect.set(...arguments); // 设置原始数据
        },
    });
}

const obj = reactive({
    hello: 'world',
});

console.log(obj.hello); // `track()` 被调用
obj.hello = 'vue'; // `trigger()` 被调用
```

通过这种方式，Vue 可以在这些属性被访问或修改时收到通知。

> 更多详细解释，请查看 [官方文档](https://v3.vuejs.org/guide/reactivity.html#what-is-reactivity)

### 计算属性[#](https://antfu.me/posts/watch-with-reactivity#computed)

既然我们能够知道这些事件，我们可以开始深入研究 `computed`，这是“响应式”魔法开始闪耀的地方。

`computed` 就像一个自动收集响应式依赖源的 getter，并在它们发生变化时自动重新计算。

例如：

```ts
const counter = ref(1);
const multiplier = ref(2);

const result = computed(() => counter.value * multiplier.value);

console.log(result.value); // 2
counter.value += 1;
console.log(result.value); // 4
```

要了解 `computed` 的工作原理，我们需要先了解底层 API `effect`。

## Effect[#](https://antfu.me/posts/watch-with-reactivity#effect)

`effect` 是 Vue 3 中引入的新 API。在底层，它是 `computed` 和 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A247%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 中“响应式”功能的引擎。大多数时候，你不需要直接使用它。但了解它有助于你更容易理解响应式系统。
`effect` 将第一个参数作为 `getter`，第二个参数作为选项。`getter` 是一个函数，在每次运行时通过它们的 `track()` 钩子收集依赖项。选项中的 `scheduler` 字段提供了一种在依赖项更改时调用自定义函数的方法。

基本上，你可以像这样编写一个简单的 `computed`：

```ts
function computed(getter) {
    let value;
    let dirty = true;

    const runner = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true; // 依赖项更改
        },
    });

    // 返回的应该是一个 `Ref`，这里简化了
    return {
        get value() {
            if (dirty) {
                value = runner(); // 重新计算
                dirty = false;
            }
            return value;
        },
    };
}
```

如果你真的对它在 Vue 中的工作原理感兴趣，请查看 [源代码](https://github.com/vuejs/core/blob/main/packages/reactivity/src/computed.ts)

## 自己实现一个 `watch`[#](https://antfu.me/posts/watch-with-reactivity#build-yourself-a-watch)

我们已经完成了 `@vue/reactivity` 中最重要的 API，即 `ref`、`reactive`、`effect` 和 `computed`。

哦等等，我们还缺少 `watch`！

```js
import { watch } from '@vue/reactivity'; // 不存在！
```

如果你查看 Vue 3 的源代码，你会发现 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A247%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 实际上是 [在 `@vue/runtime-core` 中实现的](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiWatch.ts)，与 Vue 的组件模型和生命周期一起实现。主要原因是 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A247%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 与组件的生命周期深度绑定（自动销毁、失效等）。但这不应该阻止你在 Vue 之外使用它。

让我们自己实现一个 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A247%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md')！

### 基础[#](https://antfu.me/posts/watch-with-reactivity#the-basic)

首先看看 Vue 的 watch 接口

```ts
const count = ref(0);

watch(
    () => count.value,
    (newValue) => {
        console.log(`count changed to: ${newValue}!`);
    }
);

count.value = 2;
// count changed to: 2!
```

有了 `effect` 的知识，实现起来相当简单

```ts
function watch(getter, fn) {
    const runner = effect(getter, {
        lazy: true,
        scheduler: fn,
    });

    // 返回一个回调函数来停止 effect
    return () => stop(runner);
}
```

在 Vue 中，watch 默认是懒加载的，你可以添加第三个选项来给用户控制权。

### 监听 Ref[#](https://antfu.me/posts/watch-with-reactivity#watch-for-ref)

你可能还注意到 Vue 的 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A247%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 也允许直接传递 ref。

```ts
watch(count, () => {
    /* onChanged */
});
```

为此，只需将其包装成一个 getter 即可

```ts
function watch(source, fn) {
    const getter = isRef(source) ? () => source.value : source;

    const runner = effect(getter, {
        lazy: true,
        scheduler: fn,
    });

    return () => stop(runner);
}
```

### 深度监听[#](https://antfu.me/posts/watch-with-reactivity#watch-deeply)

[`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A192%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 的另一个强大功能是它允许你监听深层次的变化。

```ts
const state = reactive({
    info: {
        name: 'Anthony',
    },
});

watch(state, () => console.log('changed!'), { deep: true });

state.info.name = 'Anthony Fu';
// changed!
```

要实现这个功能，你需要收集每个嵌套属性上的 `track()` 事件。我们可以通过一个 `traverse` 函数来实现。

```ts
function traverse(value, seen = new Set()) {
    if (!isObject(value) || seen.has(value)) return value;

    seen.add(value); // 防止循环引用
    if (isArray(value)) {
        for (let i = 0; i < value.length; i++) traverse(value[i], seen);
    } else {
        for (const key of Object.keys(value)) traverse(value[key], seen);
    }
    return value;
}

function watch(source, fn, { deep, lazy = true }) {
    let getter = isRef(source) ? () => source.value : isReactive(source) ? () => source : source;

    if (deep) getter = () => traverse(getter());

    const runner = effect(getter, {
        lazy,
        scheduler: fn,
    });

    return () => stop(runner);
}
```

完成了！剩下的就是打磨，添加重载以使其更灵活，添加更多选项以获得更好的控制，并处理一些边缘情况。然后你就可以开始使用自定义的 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A192%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 了！

## 生命周期[#](https://antfu.me/posts/watch-with-reactivity#lifecycles)

在 Vue 中，`computed` 和 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A192%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md') 会自动将它们的 `effect` 运行器绑定到当前组件实例。当组件卸载时，绑定到它的 effect 会自动销毁。更具体地说，你可以在[这里阅读源码](https://github.com/vuejs/core/blob/985bd2bcb5fd8bccd1c15c8c5d89a6919fd73922/packages/runtime-core/src/apiWatch.ts#L294)。

由于我们没有实例，如果你想停止这些 effect，你必须手动进行。当你使用多个 effect 时，要一起停止它们，你必须手动收集它们。一个更简单的方法是模拟类似 Vue 的生命周期。这需要一些工作，我将在另一篇博客文章中解释。请继续关注。

## 总结[#](https://antfu.me/posts/watch-with-reactivity#take-away)

感谢阅读！希望这对你理解和更好地使用 Vue 的响应式系统有所帮助。如果你想在 Vue 之外使用 [`watch`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FVolumes%2Faoe%2Fweb-design%2Fblog%2Fdocs%2Fblog%2FWatch%20with%20%40vue_reactivity%24ZH_CH%20copy.md%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A192%2C%22character%22%3A0%7D%5D 'docs/blog/Watch with @vue_reactivity$ZH_CH copy.md')，我为你做了一个（比上面的例子更健壮）。

```bash
npm i @vue-reactivity/watch
```
