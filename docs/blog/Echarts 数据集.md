---
aside: true
---

<script setup>
import { ref, onMounted } from 'vue';
const dom = ref(null);
const dom1 = ref(null);
const dom2 = ref(null);
onMounted(()=>{
    const myChart = window.echarts.init(dom.value);
    const option = {
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                data: [120, 200, 150, 80, 70, 110, 130],
                type: 'bar'
            }
        ]
    };
    myChart.setOption(option);

    const myChart1 = window.echarts.init(dom1.value);
    const option1 = {
        legend: {},
        tooltip: {},
        dataset: {
            source: [
            ['product', '2012', '2013', '2014', '2015'],
            ['Matcha Latte', 41.1, 30.4, 65.1, 53.3],
            ['Milk Tea', 86.5, 92.1, 85.7, 83.1],
            ['Cheese Cocoa', 24.1, 67.2, 79.5, 86.4]
            ]
        },
        xAxis: [
            { type: 'category', gridIndex: 0 },
            { type: 'category', gridIndex: 1 }
        ],
        yAxis: [{ gridIndex: 0 }, { gridIndex: 1 }],
        grid: [{ bottom: '55%' }, { top: '55%' }],
        series: [
            // 这几个系列会出现在第一个直角坐标系中，每个系列对应到 dataset 的每一行。
            { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
            { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
            { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
            // 这几个系列会出现在第二个直角坐标系中，每个系列对应到 dataset 的每一列。
            { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
            { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
            { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
            { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 }
        ]
        };
    myChart1.setOption(option1);
})
</script>

# Echarts 数据集应用

:::tip 摘自 Echarts 官方文档
数据集（dataset）是专门用来管理数据的组件。虽然每个系列都可以在 `series.data` 中设置数据，但是从 ECharts4 支持数据集开始，更推荐使用数据集来管理数据。因为这样，数据**可以被多个组件复用**，也方便进行 **“数据和其他配置” 分离**的配置风格。毕竟，在运行时，数据是最常改变的，而其他配置大多并不会改变。

-   数据在多个集合复用
-   数据和其他配置分离
-   数据支持更多的格式
-   避免数据的复杂格式转换

:::

需要注意并不是所有的图表都支持数据集，可以查看[这里](https://echarts.apache.org/zh/option.html#dataset)查看支持的图表。

## 为什么使用数据集

以前我们都是在 `series.data` 中设置数据的，这种方式快速简单直接，代码简洁明了，容易理解。直接操作数据的数组了，灵活性也还不错，适合处理简单的数据变动情况。

但是这样一旦出现多个系列的情况，数据就会变得混乱，不好维护。而且数据的格式也是有限制的，比如我们要在一个图表中展示多个系列的数据，这时候就需要对数据进行转换，这样就会增加代码的复杂度。并且数据较大时，数据的频繁变动也会导致性能问题。

ECharts4 开始提供了 `dataset` 选项来管理数据集，这种方式有以下优点和缺点：

优点

-   **数据集中管理**：通过 `dataset` 集中管理数据，避免数据冗余，提高代码可维护性。
-   **数据共享**：多个系列可以共享同一个数据集，减少数据重复，提高性能。
-   **数据转换**：支持数据转换和过滤功能，可以在图表渲染前对数据进行预处理。
-   **清晰的结构**：数据和图表配置分离，结构更加清晰，适合复杂的数据展示需求。

缺点

-   **学习成本**：需要学习和理解 `dataset` 的使用方法，对于初学者可能有一定的学习成本。
-   **复杂性增加**：对于简单的数据展示，使用 `dataset` 可能会增加代码的复杂性。

例如下面的示例，点击查看 `series.data` 和 `dataset` 的 `options` 对比：

:::magic-move

```js [series.data]
option = {
    xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
        type: 'value',
    },
    series: [
        {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: 'bar',
        },
    ],
};
```

```js [dataset]
option = {
    dataset: {
        source: [
            ['Mon', 120],
            ['Tue', 200],
            ['Wed', 150],
            ['Thu', 80],
            ['Fri', 70],
            ['Sat', 110],
            ['Sun', 130],
        ],
    },
    xAxis: {
        type: 'category',
    },
    yAxis: {
        type: 'value',
    },
    series: [
        {
            type: 'bar',
        },
    ],
};
```

:::

<div style="width: 100%;height:400px;" ref="dom"></div>

这样看其实还是差不多的，但是当数据量大数据结构复杂的时候，`dataset` 就会体现出它的优势。比如下面的示例，我们要展示多个系列的数据：

```js
option = {
    legend: {},
    tooltip: {},
    dataset: {
        source: [
            ['product', '2012', '2013', '2014', '2015'],
            ['Matcha Latte', 41.1, 30.4, 65.1, 53.3],
            ['Milk Tea', 86.5, 92.1, 85.7, 83.1],
            ['Cheese Cocoa', 24.1, 67.2, 79.5, 86.4],
        ],
    },
    xAxis: [
        { type: 'category', gridIndex: 0 },
        { type: 'category', gridIndex: 1 },
    ],
    yAxis: [{ gridIndex: 0 }, { gridIndex: 1 }],
    grid: [{ bottom: '55%' }, { top: '55%' }],
    series: [
        // 这几个系列会出现在第一个直角坐标系中，每个系列对应到 dataset 的每一行。
        { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
        { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
        { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
        // 这几个系列会出现在第二个直角坐标系中，每个系列对应到 dataset 的每一列。
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
    ],
};
```

<div style="width: 100%;height:400px;" ref="dom1"></div>

通过对比可以看出，使用 `dataset` 可以更好地管理和共享数据，适合复杂的数据展示需求，而直接在 `series.data` 中设置数据则适合简单的场景。选择哪种方式取决于具体的应用场景和需求。

## 一些概念

**维度**：文字
维度指的是看数据的角度，比如我们要展示一个表格，表格中有产品名称和销售额，那么产品名称和销售额就是两个维度。在 ECharts 中，维度是指数据的列，一个维度对应数据集中的一列数据。
数据集中的每一列称为一个维度，维度的数量决定了数据的维度。比如上面的示例中，`['product', '2012', '2013', '2014', '2015']` 就是一个维度。

**指标**：数值
指标指的是数据的具体数值，比如我们要展示一个表格，表格中有产品名称和销售额，那么销售额就是一个指标。在 ECharts 中，指标是指数据的行，一个指标对应数据集中的一行数据。
数据集中的每一行称为一个指标，指标的数量决定了数据的指标。比如上面的示例中，`['Matcha Latte', 41.1, 30.4, 65.1, 53.3]` 就是一个指标。

:::tip 总结
维度是看数据的角度，被看的数据就是指标。
维度是事物或现象的某种特征，如性别、地区、时间等。维度决定了数据的分类，例如定性维度（如“每个”、“各个”等）
指标则是被看的数据，绝大多数情况下指标字段的取值是数字，如用户数、销售额等
:::

🙋🏻‍♂️ 未完待续...
