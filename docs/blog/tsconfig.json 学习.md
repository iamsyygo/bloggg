---
completedAt: 2024-11-21 # 期待完成时间
currentState: 2 # 当前状态 0: 未开始 1: 进行中 2: 已完成
---

# tsconfig.json 学习

::: tip
`tsc` 是 ts 的编译器，`tsconfig.json` 是 ts 的配置文件，用于配置 `tsc` 的编译选项。
:::

## 常用的 `tsc` 命令

当执行 `tsc` 命令时，`tsc` 会在当前目录查找 `tsconfig.json` 文件，如果找不到，则会继续向上查找，直到找到为止。如果找不到 `tsconfig.json` 文件，则会输出 ts 的 version 以及帮助信息。如果找到则根据配置文件的配置进行编译。默认情况 `tsconfig.json` 文件所在的目录就是项目的根目录。

**a. 生成 tsconfig.json 文件**

```shell
tsc --init
```

**b. 编译 ts 文件**

```shell
tsc xxx.ts
```

**c. 编译整个项目**

```shell
tsc
```

## tsconfig.json 配置

[tsconfig.json](https://www.typescriptlang.org/tsconfig) 是一个 json 文件，采用 json5 的格式，所以可以使用注释。`tsconfig.json` 的配置分为两部分，一部分是编译选项，一部分是非编译选项。

-   a. 编译选项控制着编译的行为，比如输出目录、模块规范、是否生成 sourceMap 等。
-   b. 非编译选项控制的是 ts 编译器要编译的项目（文件）信息。

### 非编译选项

-   `files`：指定要编译的文件列表(不支持 glob 匹配语法)。如果指定了 `files`，则只会编译指定的文件，不会编译其他文件。

:::magic-move

```json [正确]
{
    "files": ["src/index.ts"]
}
```

```json [错误]
{
    "files": ["src/**/*"] // error TS6053: 找不到文件“xxx/src/*.ts
}
```

:::

```shell
.
├── README.md
├── main.ts # 不会被编译
├── src
│   ├── index.js
│   └── index.ts
└── tsconfig.json
```

-   `include`：指定要编译的文件列表，**支持 glob 匹配语法**。如果指定了 `include`，则只会编译指定的文件，不会编译其他文件。

```json
{
    "include": ["main.ts", "src/**/*"]
}
```

在使用 glob 匹配模式时，可以不添加后缀 `.ts`，`tsc` 会自动查找匹配的 `.ts`、`.d.ts`文件。所以 `src/**/*` 等价于 `src/**/*.ts`、`src/**/*.tsx` 和 `src/**/*.d.ts`。另外， `allowJs` 选项为 `true` 时，还会查找 `.js` 和 `.jsx` 文件。

如果 glob 匹配模式中的最后一个路径段不包含文件扩展名或通配符，则将其视为目录，并且包含该目录内具有受支持扩展名的文件。

当你只有少量文件需要编译时，可以使用 `files` 是比较方便的(不需要使用 glob 匹配语法)，但是当文件较多时，使用 `include` 会更加方便。

    a. * 匹配零个或多个字符，不包括目录分隔符(即 `/`)。
    b. ? 匹配一个字符，不包括目录分隔符。
    c. ** 匹配零个或多个目录和子目录，嵌套到任何级别的任何目录。

```json
// files 和 include 同时存在时会怎么样？
{
    "files": ["main.ts"],
    "include": ["src/**/*"]
}
```

```shell
.
├── README.md
├── main.js
├── main.ts
├── src
│   ├── index.js
│   └── index.ts
└── tsconfig.json
```

---

-   `exclude`：指定不编译的文件列表，**支持 glob 匹配语法**。如果指定了 `exclude`，则会编译除了指定的文件之外的所有文件。

```json
{
    "exclude": ["main.ts"]
}
```

`exclude` 会排除 `files` 和 `include` 中指定的文件。

```json
{
    "files": ["main.ts"],
    "exclude": ["main.ts"]
}
```

```shell
.
├── README.md
├── main.js # 还是会被编译
├── main.ts
├── src
│   └── index.ts
└── tsconfig.json
```

另外 ts 会自动忽略 `node_modules` 、`bower_components`、`jspm_packages`、`<outDir>` 等目录下的文件，不需要手动添加到 `exclude` 中。

:::warning Important
exclude 仅影响 include 设置的结果。也就是说，**它只改变 include 匹配设置中找到的文件。**

被 exclude 排除的文件仍然可能通过其他方式成为代码库的一部分，例如：

-   代码中的 import 语句
-   类型包含（types inclusion），types 中包含的
-   /// <reference 指令
-   在 files 列表中指定
    :::

---

-   `extends`：继承另一个配置文件。`extends` 的值是一个字符串，指向要继承的另一个配置文件的路径。该路径可以使用 node 的模块解析规则，所以可以使用相对路径、绝对路径、`node_modules` 中的模块名等。

```json
{
    "extends": "./tsconfig.base.json"
}
```

配置继承

-   a. 基础配置文件：首先加载基础配置文件中的配置(被继承配置的文件`tsconfig.base.json`)。
-   b. 继承配置文件：然后加载继承配置文件中的配置，**并覆盖基础配置文件中的相同配置项**(要继承配置的文件`tsconfig.json`)。

:::warning Important
配置文件中的所有相对路径都是相对于配置文件的路径的。
:::

```json
// tsconfig.base.json
{
    "compilerOptions": {
        "target": "es5",
        "module": "commonjs",
        "outDir": "./foo/dist"
    }
}
```

```json
// tsconfig.json
{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "outDir": "./dist"
    }
}
```

```shell
.
├── foo
│   ├── dist
│   └── tsconfig.json
├── tsconfig.base.json

```

:::warning Important
`extends` 不能循环引用，即不能出现 A 继承 B，B 继承 A 的情况。并且继承配置时，`files`、`include`、`exclude` 会进行覆盖原来的，而不是合并。
大多数配置属性都会被继承，但有一个例外：**references 属性不会被继承**。
:::

---

-   references：指定项目之间的依赖关系。`references` 是一个数组，每个元素都是一个对象，包含 `path` 和 `prepend` 两个属性。通过 `references` 可以将大型项目拆分成多个子项目，拆分成更小的部分，从而提高构建和编辑器交互的速度，强制组件之间的逻辑分离，并以新的和改进的方式组织代码。

```shell
.
├── tsconfig.json
├── lib
│   ├── tsconfig.json
│   └── index.ts
└── app
    ├── tsconfig.json
    └── index.ts
```

假设 `app` 项目依赖 `lib` 项目，则项目的 `tsconfig.json` 配置如下：

:::magic-move

```json [app]
{
    "references": [{ "path": "../lib" }]
}
```

```json [lib]
{
    "compilerOptions": {
        "outDir": "./dist"
    }
}
```

```json [tsconfig.json]
{
    "references": [{ "path": "./lib" }, { "path": "./app" }]
}
```

:::

将大型项目拆分成更小的部分，分别进行编译和管理：

```shell
# 先构建 lib 项目
tsc -b lib

# 再构建 app 项目
tsc -b app
```

更多请阅读：[项目引用，Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

### [编译选项](https://www.typescriptlang.org/tsconfig/#compiler-options)

#### 类型检查

1、`allowUnreachableCode`：允许无法访问的代码。默认为 `null`，提供建议作为对编辑的警告。

-   `true`：允许无法访问的代码。
-   `false`：不允许无法访问的代码，显示蓝色波浪线警告。
-   `null`：默认值，提供建议作为对编辑的警告。

:::magic-move

```ts [true]
// 无任何警告提示，tsc 编译通过
function test(n: number) {
    if (n > 0) {
        return n;
    } else {
        return n;
    }
    return n;
}
```

```ts [false]
// error TS7021: Unreachable code detected. 检测到无法访问的代码
function test(n: number) {
    if (n > 0) {
        return n;
    } else {
        return n;
    }
    return n; // 此处有蓝色波浪线提示
}
```

```ts [null]
// 编译通过
function test(n: number) {
    if (n > 0) {
        return n;
    } else {
        return n;
    }
    return n; // 此处代码被置灰，无提示
}
```

:::

:::warning Important

```ts
function typeErrorExample(): number {
    // 这里返回了一个字符串，编译器会报错
    return 'This does not affect errors on the basis of code which appears to be unreachable due to type analysis.';
}
```

typeErrorExample 函数中，返回类型与声明不符，这是类型分析错误，与 allowUnreachableCode 无关。

:::

---

2、`allowUnusedLabels`：允许未使用的标签。默认为 `null`。

-   `true`：允许未使用的标签。
-   `false`：不允许未使用的标签，显示蓝色波浪线警告。
-   `null`：默认值，提供建议作为对编辑的警告。

回顾下标签语法：标签是用来标记代码块的，可以与 break 或 continue 语句一起使用。loop1 和 loop2 就是标签。

```ts
loop1: for (let i = 0; i < 5; i++) {
    loop2: for (let j = 0; j < 5; j++) {
        if (i === 2 && j === 2) {
            break loop1; // 跳出 loop1 循环
        }
    }
}
```

:::magic-move

```ts [true]
// 无任何警告提示，tsc 编译通过
function test() {
    label: for (let i = 0; i < 10; i++) {
        console.log(i);
    }
}
```

```ts [false]
// error TS7028: Unused label. 未使用的标签
function test() {
    label: for (let i = 0; i < 10; i++) {
        console.log(i);
    }
}
```

```ts [null]
// 编译通过
function test() {
    // label 被置灰
    label: for (let i = 0; i < 10; i++) {
        console.log(i);
    }
}
```

:::

---

3、`alwaysStrict`：始终以 ECMAScript 严格模式解析并输出，并且在模块中始终生成 "use strict" 指令。默认为 `true`。

`use strict` 是一种 ECMAScript 5 引入的严格模式。在严格模式下，JavaScript 会更加严格，更多的错误会被检测出来，并且会抛出异常，而不是默默地忽略它们。

严格模式的好处：

-   捕获错误：严格模式下，更多的错误会被检测出来并抛出异常。
-   防止意外的全局变量：严格模式下，不能意外地创建全局变量。
-   消除 this 的隐式绑定：严格模式下，this 不会被隐式绑定到全局对象。
-   禁止重复参数：严格模式下，函数参数不能有重复的名称。

---

4、`exactOptionalPropertyTypes`：确保可选属性的类型与其类型声明完全匹配。启用后，对于 `type` 和 `interface` 中的可选属性的处理方式将更加严格。默认为 `false`。

```ts
interface ITest {
    name?: 'foo' | 'bar';
}

export const test: ITest = {
    name: undefined,
};
```

像上面的代码，`name` 是一个可选属性，除了可以是 `"foo"` 或 `"bar"` 之外，还可以是 `undefined`。但是这实际上是一个错误，在 js 中，test.name 是 undefined 和 未定义是不同的，这可能会导致一些问题。例如：

```ts
const test: ITest = {
    name: undefined,
};

if (test.name) {
    // 不会进入这里
}

if ('name' in test) {
    // 会进入这里
}
```

so，这并不是完全准确的，设置 `exactOptionalPropertyTypes` 为 `true` 后，使得 ts 真正的检查可选属性的类型。

```ts
interface ITest {
    name?: 'foo' | 'bar';
}

export const test: ITest = {
    name: undefined, // error TS2322: 不能将类型“undefined”分配给类型“"bar" | "foo"
};
```

---

5、`noFallthroughCasesInSwitch`：禁止在 switch 语句中的 case 子句中使用 fallthrough。默认为 `false`。

Fallthrough 是指在 switch 语句中，没有 break 语句，导致执行下一个 case 语句。

```ts
const foo = 1;

switch (foo) {
    case 1:
        console.log(1);
    case 2:
        console.log(2);
    default:
        console.log('default');
}

// 输出
// 1
// 2
// default
```

上面的代码中，`case 1` 没有 break 语句，会继续执行 `case 2` 和 `default`。设置 `noFallthroughCasesInSwitch` 为 `true` 后，禁止这种行为。

---

6、`noImplicitAny`：如果为 true，则不允许隐式的 any 类型。默认为 `true`。

```ts
// error TS7006: 参数“a”隐式具有“any”类型
function test(a) {
    return a;
}
```

---

7、`noImplicitOverride`：如果为 true，则检查类方法和属性是否正确地覆盖了父类的方法和属性。默认为 `false`。

:::magic-move

```ts [false]
class A {
    testA() {}
}

class B extends A {
    // 不会报错，不需要使用 override 关键字
    testA() {}
}
```

```ts [true]
class A {
    testA() {}
}

class B extends A {
    // error TS4114: 此成员必须有 "override" 修饰符，因为它替代基类 "A" 中的一个成员
    testA() {}
}

class C extends A {
    // 正确
    override testB() {}
}
```

:::

---

8、`noImplicitReturns`：如果为 true，则函数必须具有返回值。默认为 `false`。

```ts
const a = 1;
function test(): string {
    if (a === 1) {
        return 'Hello World';
    }
    // a !== 1 时，没有返回值
}
// error TS2366: 函数缺少结束 return 语句，返回类型不包括 "undefined"
```

---

#### Emit

Emit 分类包含与代码生成（即编译输出）相关的选项。这些选项控制 TypeScript 编译器如何生成 JavaScript 代码以及生成哪些额外的文件。

1、`outDir`：指定输出目录。默认为 `null`。.js、.d.ts 以及 .js.map 等文件将被编译到此目录中。

```json
{
    "outDir": "./dist"
}
```

如果没有指定 `outDir`，则会将编译后的文件输出到与源文件(.ts)所在的目录。

:::magic-move

```shell [outDir => dist]
.
├── README.md
├── main.ts
├── src
│   └── index.ts
├── tsconfig.json
└── dist
    ├── main.js
    └── src
        └── index.js
```

```shell [outDir => null]
.
├── README.md
├── main.ts
├── main.js
├── src
│   ├── index.ts
│   └──index.js
└── tsconfig.json
```

:::

如果计算输出的根不是你想要的，可以使用 `rootDir` 选项来指定。如

```json
{
    "rootDir": "./src",
    "outDir": "./dist"
}
```

```shell
.
├── README.md
├── main.ts
├── src
│   └── index.ts
├── tsconfig.json
└── dist
    └── index.js
```

---

2、`removeComments`：删除编译后的代码中的注释。默认为 `false`。

---

3、`module`：指定生成哪种模块系统代码。默认为 `CommonJS`。

---

4、`outFile`：将所有**全局（非模块）**文件合并为一个输出文件。如果 module 选项设置为 System 或 AMD，所有模块文件也会在全局内容之后合并到这个文件中。

:::warning Important
除非 module 为 None 、 System 或 AMD ，否则无法使用 outFile。**此选项不能用于打包 CommonJS 或 ES6 模块化。**
:::

```json
{
    "outFile": "./dist/bundle.js"
}
```

---

5、`sourceMap`：生成相应的 .map 文件。默认为 `false`。

浏览器运行的是编译后的 js 文件，而不是 ts 文件，如果出现错误，根据编译后的 js 文件很难进行分析，需要定位到 ts 文件，这时就需要 sourceMap 文件。

6、`inlineSourceMap`：将 sourceMap 信息包含在生成的 js 文件中。默认为 `false`。

默认 sourceMap 会生成一个单独的 .map 文件，如果设置 `inlineSourceMap` 为 `true`，则会将 sourceMap 信息包含在生成的 js 文件中。

---

7、`declaration`：为项目中的 TypeScript 或 JavaScript 文件生成 .d.ts 文件。默认为 `false`。

类型定义文件 (.d.ts)：

-   .d.ts 文件包含类型声明，用于描述模块的外部接口。
-   它们**不包含实际的实现代码，只包含类型信息。**

外部 API 描述：

-   .d.ts 文件描述了模块的外部 API，包括函数、类、变量、接口等的类型信息。
-   这使得其他开发者可以了解模块的使用方式，而**无需查看实现细节。**

智能提示和类型检查：

-   有了 .d.ts 文件，TypeScript 可以为未类型化的代码提供智能提示（IntelliSense）和类型检查。
-   这有助于在开发过程中捕获错误，并提高代码的可维护性和可读性。

:::tip
当 TypeScript 编译器遇到一个模块时，它会查找与该模块对应的 .d.ts 文件。如果找到了，它会使用 .d.ts 文件中的类型信息来提供智能提示和类型检查。

```ts
import { xxx } from 'lodash';

xxx();
```

在这个例子中，TypeScript 编译器会查找 lodash 模块的 .d.ts 文件，以了解 xxx 函数的类型信息。
:::

---

8、`declarationDir`：默认情况下编译器会将生成的 .d.ts 文件放在与编译后的 js 文件同级目录下。如果指定了 `declarationDir`，则会将生成的 .d.ts 文件放在指定的目录中。

```json
{
    "declaration": true,
    "declarationDir": "./dist/types"
}
```

---

9、`declarationMap`：生成相应的 .d.ts.map 文件。默认为 `false`。该文件映射回原始 .ts 文件。

---

10、`lib`：ts 提供了一些 ts 类型声明文件，如 `Promise`、`Object.freeze`、`Object` 等环境的 API 类型声明文件。这些文件可以提供很好的智能提示和类型检查。通常存放在 lib 文件夹下，我们称之为标准库。通过设置 lib 字段，手动选择导入哪些库。

-   通过设置 lib 字段，你可以手动选择要包含哪些标准库文件。这在某些情况下非常有用，例如你只需要特定的库，而不需要全部库。
    提高编译性能：

-   通过只引入必要的库，可以减少编译时间和内存占用，提高编译性能。
    避免冲突：

-   在某些情况下，你可能会使用自定义的类型声明文件，通过设置 lib 字段，可以避免与标准库的冲突。

:::warning Important
如果你不设置 lib 字段，TypeScript 会根据 target 选项自动引入相应的标准库。例如，如果 target 设置为 es5，TypeScript 会自动引入 es5 的标准库。因此，在大多数情况下，你可能不需要手动设置 lib 字段，除非你有特定的需求。
:::

---

11、`typeRoots`：我们在使用安装一些三方 npm 包时，并不是所有的包都有类型声明文件，例如 `lodash-es`、`jquery` 等。这些包可能是使用 JavaScript 编写的，无法使用 TypeScript 编译器提供的功能生成类型声明文件。这时我们可以手动编写类型声明文件或者安装社区提供的类型声明文件。默认值为 `["node_modules/@types"]`。
如 `@types/lodash-es`、`@types/jquery` 等。通过设置 `typeRoots` 字段，手动指定类型声明文件的目录。

```json
{
    "typeRoots": ["./node_modules/@types", "./typings"]
}
```

默认情况下，TypeScript 会从 node_modules/@types 文件夹下导入所有类型声明至全局空间。需要注意的是，**对于没有使用 `import` 或 `export` 的脚本文件才会被导入到全局空间。**而对于使用 `import` 或 `export` 的模块文件，仅仅在模块内部有效。

:::warning Important
如果设置了 typeRoots 字段为 ["./typings"]，则 TypeScript 只会从这目录下导入类型声明文件，而不会从 node_modules/@types 目录下导入类型声明文件。

:::

---

12、`types`：默认情况下，所有可见的 `node_modules/@types` 包都会包含在你的编译中。任何包含文件夹中的`node_modules/@types` 文件夹中的包都会被视为可见。例如，这意味着`./node_modules/@types/`、`../node_modules/@types/`、`../../node_modules/@types/` 等文件夹中的包都会被包含。

如果指定了 `types`，则只有列出的包会被包含在全局作用域中。例如：

```json
{
    "compilerOptions": {
        "types": ["node", "lodash"]
    }
}
```

在这个配置中，只有 `node` 和 `lodash` 的类型声明包会被包含在全局作用域中，其他所有的 `@types` 包都会被忽略。

-   默认值：如果未指定，TypeScript 会包含所有在 node_modules/@types 目录中的类型声明包。
-   使用场景：当你希望 TypeScript 只包含特定的类型声明包时，可以使用 types。

:::tip 区别

-   typeRoots：用于指定类型声明文件的根目录。TypeScript 会从这些目录中加载所有类型声明文件。
-   types：用于指定要包含的类型声明包。TypeScript 只会包含这些包中的类型声明。

```json
{
    "compilerOptions": {
        "types": ["node", "jest", "express"]
    }
}
```

配置了上述 tsconfig.json 后，TypeScript 编译器将只加载并使用 node、jest 和 express 的类型声明包，其他类型声明包将被忽略。这有助于减少不必要的类型声明，提高编译性能，并避免潜在的类型冲突。
:::

假设你有以下 tsconfig.json 配置：

```json
{
    "compilerOptions": {
        "types": ["node", "jest", "express"]
    }
}
```

在这种配置下，TypeScript 编译器将只加载并使用 node、jest 和 express 的类型声明包，其他类型声明包将被忽略。

代码示例

```ts
import * as moment from 'moment';
moment().format('MMMM Do YYYY, h:mm:ss a');
```

即使 moment 不在 types 数组中，你仍然可以导入并使用它：

因为 moment 是一个模块，TypeScript 会根据 node_modules 中的类型声明文件为其提供类型信息。

---

13、`target`：指定 ECMAScript 目标版本。指定 TypeScript 编译器生成的 JavaScript 代码的目标版本。

---

14、`esModuleInterop`：启用对 ES 模块语义的互操作性支持。它允许 TypeScript 更好地与 CommonJS 模块进行互操作，特别是在处理默认导入和命名空间导入时。

-   默认导入：启用 esModuleInterop 后，你可以使用默认导入语法来导入 CommonJS 模块，而不需要使用命名空间导入。
-   命名空间导入：启用 esModuleInterop 后，TypeScript 会自动为 CommonJS 模块生成命名空间导入。

假设你有一个 CommonJS 模块 lodash，并且你希望在 TypeScript 中导入它。

:::magic-move

```ts [启用]
// 使用默认导入语法来导入 CommonJS 模块，而不需要使用命名空间导入。
import _ from 'lodash';
```

```ts [禁用]
import * as _ from 'lodash';
```

:::
