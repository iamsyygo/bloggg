---
completedAt: 2024-11-21 # 期待完成时间
currentState: 2 # 当前状态 0: 未开始 1: 进行中 2: 已完成
---

# 用 pnpm 管理 monorepo

在现代前端开发中，monorepo（单一代码库）是一种常见的项目管理方式，它允许多个项目共享一个代码库。pnpm 特别适合管理 monorepo 项目。本文将详细介绍如何使用 pnpm 管理 monorepo 项目。

::: tip
pnpm 是一个快速、零依赖、并行安装的包管理器。内置了对**单一存储库**（也称为**多包存储库、多项目存储库或单体存储库**）的支持，创建一个 workspace 以将多个项目合并到一个仓库中。也就是所说的 monorepo 项目管理方式，它提供一些特殊的命令来管理 monorepo 项目。详情可以查看 [pnpm 官网 - 工作空间（Workspace）](https://pnpm.io/zh/workspaces)。

使用 pnpm 管理 monorepo 项目可以提高开发的效率，减少重复代码，并简化依赖管理。当然这不是绝对的，也有一些缺点，例如：包之间的依赖关系可能会变得复杂，包的版本管理可能会变得困难还有一定的学习成本。因此，需要根据具体情况选择合适的项目管理方式。
:::

## Usage

### 创建 workspace

项目的根目录中**必须有 `pnpm-workspace.yaml` 文件**。也可能有 `.npmrc`。

`pnpm-workspace.yaml` 文件用于定义一个 workspace(定义工作区中的包)。这样它就可以在一个 monorepo 中管理多个包，并且可以在这些包之间**共享依赖和脚本**。这个文件的主要作用是告诉 pnpm 哪些目录包含工作区中的包。

```yaml
packages:
    - 'packages/*'
    - 'components/*'
    - '!**/test/**'
```

[`.npmrc`](https://pnpm.io/zh/npmrc) 文件用于配置 `npm` 或 `pnpm` 的行为。如注册表地址、缓存目录、认证信息等。对于 pnpm，它也可配置如启用或禁用某些功能。我们知道 `pnpm` 与 `npm` 管理依赖方式是不一样的。

```ini
registry=https://registry.npmjs.org/
strict-peer-dependencies=false
auto-install-peers=true
```

-   pnpm-workspace.yaml 文件用于定义工作区中的包，便于在 monorepo 中管理多个包。
-   .npmrc 文件用于配置 npm 或 pnpm 的行为，提供灵活的配置选项以满足不同的需求。

### 安装依赖

创建所需要的包目录，需要注意目录名称要符合 `pnpm-workspace.yaml` 中定义的规则。

```bash
mkdir packages
mkdir apps

cd packages
mkdir foo
cd foo
pnpm init -y
# ...
```

zai monorepo 项目中通常会有一些共享依赖，这些依赖会被许多包共享使用的。可以在根目录下安装这些依赖，这样就无需在每个包中都安装一遍：

```shell
pnpm add lodash -w

# D is short for --save-dev
pnpm add typescript -Dw
```

使用 `-w` 参数，表示在工作区范围内安装依赖。这样按照模块查找机制，会在包目录中查找依赖，如果没有找到，向上查找，直到在工作区根目录中找到。

---

如果不是一个共享依赖，而是一个特定包的依赖，可以在包目录中安装依赖：

```bash
cd packages/foo
pnpm add react
```

### 运行脚本

可以在根目录的 package.json 文件中定义一些常用的脚本，例如构建和测试：

```json
{
    "scripts": {
        "build": "pnpm run build -r",
        "test": "pnpm run test -r"
    }
}
```

`-r` 参数表示递归运行 `workspace` 中每个包中的脚本。of course，也可以在每个包中目录中运行 `pnpm run <script>` 来运行这些脚本。

`--filter <package-name>` 选项可以指定只运行指定包中的脚本。例如，要运行名为 foo 的包中的脚本，可以运行以下命令：

```bash
pnpm run build --filter foo
```

## 共享代码

## 类型支持

在 monorepo 中使用 TypeScript 时，通常会在根目录和每个包中都有一个 tsconfig.json 文件。根目录的 tsconfig.json 文件用于配置全局的 TypeScript 设置，而每个包中的 tsconfig.json 文件用于配置包特定的设置。

https://github.com/colinhacks/live-typescript-monorepo/blob/main/README.md
