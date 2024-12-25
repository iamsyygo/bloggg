---
aside: true
transmitted: true
transmittedFrom: 'https://nhost.io/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo'
transmittedAuthor: 'Nhost'
translated: true
completedAt: 2024-12-25 # 期待完成时间
currentState: 2 # 当前状态 0: 未开始 1: 进行中 2: 已完成
---

# 我们如何为 monorepo 配置 pnpm 和 Turborepo

::: tip
原文：[How we configured pnpm and Turborepo for our monorepo](https://nhost.io/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo) ，作者：[Nhost](https://nhost.io/)
:::

![如何为 monorepo 配置 pnpm 和 Turborepo 的横幅](https://nhost.io/_next/image?url=%2Fimages%2Fblog%2Fhow-we-configured-pnpm-and-turborepo-for-our-monorepo%2Fbanner.png&w=3840&q=100)

# 简介

12 个月前，我们有 10 多个独立仓库的 npm 包。事情开始变得不一致且失控。开发速度越来越慢，我们无法快速迭代。

为了解决这些问题，我们决定迁移到 monorepo。我们选择了 [pnpm](https://pnpm.io/) 作为包管理器，以及 [Turborepo](https://turbo.build/repo) 作为构建系统。在这篇文章中，我们将解释如何配置它们以使其良好协同工作。

## 问题

要理解为什么我们想要迁移到 monorepo，首先要了解迁移前我们遇到的问题。

-   **依赖管理:** 依赖需要在包之间手动管理。例如，如果 `package-a` 依赖 `package-b`，当 `package-b` 更新时，我们必须手动更新 `package-a` 中 `package-b` 的版本。理想情况下，这应该是自动化的。
-   **CI/CD:** 由于包分散在不同的仓库中，我们有多种测试、构建、版本控制和发布包的方式。这既低效又难以维护，我们很难确保相同的质量标准和 npm 包结构的一致性。相反，我们希望为所有包建立标准化的 CI/CD 设置，避免重复工作。
-   **重构:** 包之间通常相互依赖，这使得在开发过程中很难同步它们。我们发现自己在文件夹之间创建符号链接和复制代码，这显著降低了我们的开发效率。相反，我们希望有一个单一的流程，在开发过程中自动监视所有包并重新构建和链接它们。
-   **一致性:** 每个包和仓库都有独立的 eslint 和 vite 配置。如果我们在一个包中做了更改，就必须手动更改其他包以保持相同的配置。这种手动工作并不总是正确执行，导致仓库之间的配置不匹配。这再次降低了我们的开发效率。由于几乎所有包都需要相同的配置，集中管理配置以保持单一数据源变得很重要。
-   **孤立:** 团队成员之间很少有协作和知识共享。每个工程师往往以孤立的方式"拥有"他们的仓库。我们认为通过在同一个仓库中工作可以分享彼此的专业知识。
-   **可重用性:** 我们的包经常需要相同的辅助函数或使用相同的模式。将包放在不同的仓库中意味着我们在不同的仓库中重复代码或以略微不同的方式解决类似的问题。这最终降低了代码质量并增加了工程开销。如果所有包都能访问共享代码和模式会更好。
-   **可见性:** 拥有 10 多个仓库使得 Nhost 社区很难找到合适的包来探索、贡献或创建问题。我们的社区也很难对我们维护的不同包有一个好的概览。我们希望让开发者更容易在一个入口点找到并为我们的代码做贡献。

这些是我们迁移到 monorepo 之前遇到的问题。让我们看看我们是如何解决这些问题的。

## 包管理器: pnpm

在决定使用什么包管理器时，我们需要工作区支持。过去，只有 Yarn 原生支持工作区，这使其成为 monorepos 的绝佳选择，并由 Lerna 辅助处理包版本控制。

然而，在工作区中管理多个包在性能方面是一个挑战。如果贡献者在安装包依赖时要等待几分钟，他们很快就会失去耐心，CI 作业也会受到影响，因为有些作业在每次 GitHub 推送和拉取请求时都会执行。

在评估 npm、yarn 和 pnpm 时，pnpm 的速度明显更快。这在 monorepo 设置中尤其明显，pnpm 展示了令人印象深刻的结果。

以下是在我们的 monorepo 中安装所有包依赖所需时间的概览:

![安装时间(秒)](https://nhost.io/images/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo/package-manager-installation-time.png)

![安装时间(秒)](https://nhost.io/images/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo/package-manager-installation-time-single-package.png)

![node_modules 大小(MB)](https://nhost.io/images/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo/package-manager-size-of-node-modules.png)

如你所见，pnpm 在所有指标上都更快更好:

-   安装所有包
-   安装新包
-   `node_modules/` 的总大小

### pnpm 工作区

设置 pnpm 工作区很简单。pnpm 只需要一个根 `package.json` 文件，和一个描述子包位置的 `pnpm-workspace.yaml`。这是我们的 `pnpm-workspace.yaml` 文件:

```yaml
packages:
    - 'packages/**'
    - 'docs'
    - '!**/test/**'
    - 'examples/**'
```

### 强制使用 `pnpm`

我们的一些贡献者使用 `npm` 或 `Yarn`。为了确保开发者在我们的 monorepo 中使用 `pnpm`，我们将 [`only-allow`](https://www.npmjs.com/package/only-allow) 配置为 [`preinstall`](https://docs.npmjs.com/cli/v9/using-npm/scripts#life-cycle-operation-order) 脚本:

```json
"preinstall": "npx only-allow pnpm"
```

### 谁在使用 pnpm?

Nhost 是 pnpm 的忠实用户，以下项目和公司也在使用:

-   [Next.js](https://github.com/vercel/next.js)
-   [Vite](https://github.com/vitejs/vite)
-   [Prisma](https://github.com/prisma/prisma)
-   [Astro](https://github.com/withastro/astro)
-   [SvelteKit](https://github.com/sveltejs/kit)
-   [Turborepo](https://github.com/vercel/turbo)

来源: https://pnpm.io/workspaces#usage-examples

### 赞助 pnpm

Nhost 也是 pnpm 的骄傲赞助商!

<iframe id="twitter-widget-0" scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen="true" class="" title="X Post" src="https://platform.twitter.com/embed/Tweet.html?creatorScreenName=nhost&amp;dnt=false&amp;embedId=twitter-widget-0&amp;features=eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOltdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2VyX2NvdW50X3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9iYWNrZW5kIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19yZWZzcmNfc2Vzc2lvbiI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfZm9zbnJfc29mdF9pbnRlcnZlbnRpb25zX2VuYWJsZWQiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X21peGVkX21lZGlhXzE1ODk3Ijp7ImJ1Y2tldCI6InRyZWF0bWVudCIsInZlcnNpb24iOm51bGx9LCJ0ZndfZXhwZXJpbWVudHNfY29va2llX2V4cGlyYXRpb24iOnsiYnVja2V0IjoxMjA5NjAwLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X3Nob3dfYmlyZHdhdGNoX3Bpdm90c19lbmFibGVkIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19kdXBsaWNhdGVfc2NyaWJlc190b19zZXR0aW5ncyI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfdXNlX3Byb2ZpbGVfaW1hZ2Vfc2hhcGVfZW5hYmxlZCI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfdmlkZW9faGxzX2R5bmFtaWNfbWFuaWZlc3RzXzE1MDgyIjp7ImJ1Y2tldCI6InRydWVfYml0cmF0ZSIsInZlcnNpb24iOm51bGx9LCJ0ZndfbGVnYWN5X3RpbWVsaW5lX3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9mcm9udGVuZCI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9fQ%3D%3D&amp;frame=false&amp;hideCard=false&amp;hideThread=false&amp;id=1539261896531976199&amp;lang=en&amp;origin=https%3A%2F%2Fnhost.io%2Fblog%2Fhow-we-configured-pnpm-and-turborepo-for-our-monorepo&amp;sessionId=d9efd9a1dfd93c5a220ec953c8a6516e764dc9c6&amp;siteScreenName=nhost&amp;theme=light&amp;widgetsVersion=2615f7e52b7e0%3A1702314776716&amp;width=550px" data-tweet-id="1539261896531976199" style="box-sizing: border-box; border: 0px solid rgb(229， 231， 235); --tw-border-spacing-x: 0; --tw-border-spacing-y: 0; --tw-translate-x: 0; --tw-translate-y: 0; --tw-rotate: 0; --tw-skew-x: 0; --tw-skew-y: 0; --tw-scale-x: 1; --tw-scale-y: 1; --tw-pan-x: ; --tw-pan-y: ; --tw-pinch-zoom: ; --tw-scroll-snap-strictness: proximity; --tw-ordinal: ; --tw-slashed-zero: ; --tw-numeric-figure: ; --tw-numeric-spacing: ; --tw-numeric-fraction: ; --tw-ring-inset: ; --tw-ring-offset-width: 0px; --tw-ring-offset-color: #fff; --tw-ring-color: rgba(59，130，246，.5); --tw-ring-offset-shadow: 0 0 #0000; --tw-ring-shadow: 0 0 #0000; --tw-shadow: 0 0 #0000; --tw-shadow-colored: 0 0 #0000; --tw-blur: ; --tw-brightness: ; --tw-contrast: ; --tw-grayscale: ; --tw-hue-rotate: ; --tw-invert: ; --tw-saturate: ; --tw-sepia: ; --tw-drop-shadow: ; --tw-backdrop-blur: ; --tw-backdrop-brightness: ; --tw-backdrop-contrast: ; --tw-backdrop-grayscale: ; --tw-backdrop-hue-rotate: ; --tw-backdrop-invert: ; --tw-backdrop-opacity: ; --tw-backdrop-saturate: ; --tw-backdrop-sepia: ; display: block; vertical-align: middle; visibility: visible; width: 550px; height: 651px; flex-grow: 1;"></iframe>

所以，pnpm 是我们 monorepo 的可靠包管理器和工作区管理器。接下来，我们来看看 Turborepo 作为我们 monorepo 的构建系统。

## 构建系统: Turborepo

Javascript 生态系统中有许多优秀的 monorepo 工具:[Nx](https://nx.dev/)、[Lerna](https://github.com/lerna/lerna)，以及三个主要的包管理器([npm](https://www.npmjs.com/)、[Yarn](https://yarnpkg.com/) 和 [pnpm](https://pnpm.io/))现在都支持工作区。

由于过去的经验，我们对使用 Lerna 作为构建系统有些顾虑，我们也对其[维护状况有所担忧](https://github.com/lerna/lerna/issues/3062)(Nx 当时还没有接手重生它)。在测试中，Lerna 的速度也明显慢于 Nx 和 Turborepo。

这就留下了两个选择:Nx 和 Turborepo。

设置完美的 monorepo 很困难。我们知道我们需要为 JavaScript 和 TypeScript 构建大量目标的包和示例:

-   ES 模块
-   CommonJs
-   UMD

此外，我们还必须确保我们的设置能够与 React、Vue、Svelte 和其他未来的框架一起工作。

经过一些探索和测试，我们觉得 Nx 对我们的团队来说学习曲线太陡。我们也觉得 Nx 太过固执己见，很难根据我们的需求进行定制。

Turborepo 更适合我们。它是一个易于配置和定制的构建系统。虽然它不如 Nx 和 Lerna 成熟，但我们看到了 Turborepo 成为优秀 monorepo 工具的潜力。它非常(非常!)快，并且有很好的社区和来自 [Vercel](https://vercel.com/docs/concepts/monorepos/turborepo) 的支持。

我们选择 Turborepo 的另一个原因是它的模型比 Nx 更加中立，允许我们在需要时转移到其他工具，回退到基础的 npm、Yarn 或 pnpm 工作区，并由 Lerna 补充。

最后，一个决定性的方面是 Turborepo 与其他工具的集成，特别是 pnpm 和 [changesets](https://github.com/changesets/changesets)。我们将在后续博文中深入探讨 changesets。

### Turborepo 配置

设置基本的 Turborepo 配置很简单:首先，你需要描述[开发任务](https://turbo.build/repo/docs/handbook/dev)之间的依赖关系，并添加一些关于如何缓存构建产物的信息。让我们看看我们在 `turbo.json` 文件中如何定义 `build` 管道:

```json
{
  "$schema": "https://turborepo.org/schema.json"，
  "baseBranch": "origin/main"，
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]，
      "outputs": ["dist/**"， "umd/**"， "build/**"， ".next"]
    }
  }
}
```

在上面的配置中，我们告诉 Turborepo 在构建一个包时，需要先构建该包的依赖项`"dependsOn": ["^build"]`。我们还确定了管道的 `outputs`，以便缓存 `dist`、`umd`、`build` 或 `.next` 中的所有内容。

然后，我们在根 `package.json` 文件中定义了最常用的构建任务，并带有一些过滤选项:

```json
"scripts": {
    "build": "pnpm run build:all --filter=!@nhost/docs --filter=!@nhost-examples/*"，
    "build:docs": "pnpm run build:all --filter=@nhost/docs"，
    "build:all": "turbo run build  --include-dependencies"
}
```

`build` 脚本构建除示例和文档之外的所有内容，而 `build:docs` 只构建文档，`build:all`(你猜对了!)构建所有内容。

回顾来看，Turborepo 缓存工作得非常好。当我们的库包的初始构建`pnpm run build`需要 30 秒时，从缓存运行相同的任务只需要 0.2 秒。这为我们的团队节省了大量时间。

### 谁在使用 Turborepo?

Nhost 是 Turborepo 的忠实用户，以下项目和公司也在使用:

-   [Vercel](https://vercel.com/)
-   [AWS](https://aws.amazon.com/)
-   [Microsoft](https://www.microsoft.com/)
-   [Netflix](https://www.netflix.com/)
-   [Disney](https://www.disney.com/)

来源: https://turbo.build/showcase

## 在 JavaScript 和 TypeScript 中解析包构建

monorepo 中的一个常见挑战是将包链接在一起，以便它们可以作为依赖项重用。使用工作区使 JavaScript 变得简单，但 TypeScript 在 monorepo 中不太友好，因为它以不同的方式解析内部依赖。

Node 使用传统的 Node 模块解析方式，这在 pnpm 工作区中[得到了出色的实现](https://pnpm.io/motivation)。但是，TypeScript 期望在每个 `tsconfig.json` 中提供有关在哪里找到其依赖项的信息。

此外，开发环境和构建环境可能不同。我们发现在 GitHub 上几乎每个 monorepo 都有不同的解决方案。

我们决定采用最简单的方法。在开发过程中，我们会构建每个包，并根据每个 `package.json` 文件中 `main`、`module`、`types` 和 `exports` 字段的定义来使用解析。这样，我们在开发和生产中使用相同的包配置，避免了过于复杂的 TypeScript 设置。此外，由于 IDE 使用每个包的构建类型，这显著减轻了开发过程中 TypeScript 引擎的负担。

当然，这也有一些权衡:

-   在我们的 monorepo 中，包在被用作另一个包的依赖项之前需要先构建。幸运的是，由于 Turborepo 及其缓存的高性能，这并不是一个大问题。与 Vite 一起，包的重建非常快。
-   IDE 有时无法跟上包类型的最新更改，因为它们被 IDE 处理为任何其他依赖项，即不期望它们发生变化。在使用 VS Code 时，我们有时需要重启 TypeScript 服务器。

## 构建和打包

如前所述，我们在打包方面的要求相当广泛。我们想要生产能够在 CommonJS 和 UMD 中作为 ES 模块工作的类型化包。我们还希望能够打包 React 或 Vue 组件。另一方面，在众多打包工具和转译器中很容易迷失方向。我们选择了 Vite，因为它快速、易于配置且足够中立。我们将在后续博文中详细介绍 Vite。

## 配置

我们还预见到会有大量的配置文件，并希望保持根文件夹尽可能简单，这样贡献者可以专注于包而不是它们如何组合在一起。因此，我们尽可能将这些文件放在 monorepo 根目录的 [`config/`](https://github.com/nhost/nhost/tree/main/config) 目录中。

## 我们的 Monorepo

这是我们 monorepo 的链接: https://github.com/nhost/nhost
