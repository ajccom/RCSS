# RCSS 一种样式编写新尝试 

## 背景

作为一名切图仔，在日常工作中编写 CSS 是我的主要工作之一。从过往经历看，编写 CSS 的过程不可谓令人满意。从设计稿到 HTML 文件到 CSS 文件，虽然这种拆分做到了内容与样式职责分离，但是对于开发体验却带来了一定的繁琐，所以我们也能从一些项目代码中发现一些诸如直接写行内样式的代码。

```html
<div style="margin-top:10px"></div>
```

这种代码我相信并不是作者不懂如何规范编写样式，而只是为了“省事”。因为这样做只需要一步即可达到目的，而规范的做法则需要两步：一，创建样式名称；二，编写样式名称对应的样式规则。

```html
<div class="klass"></div>
```

```css
.klass {
  margin-top: 10px;
}
```

虽然 CSS 的历史经过了包括样式拆分合并、预处理、后处理等阶段，但是这个步骤始终没有得到有效改善。所以我结合一些经验和思考，整理撰写本文介绍一种可以仅通过编写 class name 即可创建出相关样式的方案。

## RCSS 介绍

RCSS 的名称，意为`反应式 CSS`，R 是 Reactive 的简写。这个名称是源于 RCSS 具备基于 class name 动态创建样式规则的能力。相较于传统的 CSS 编写方式需要在 HTML 标签上编写 class name，再在 css 文件编写样式规则，RCSS 提供了一种更简便的样式编写实现方式。

无论是在源码编写阶段还是宿主环境运行阶段，只要元素 class name 符合 RCSS 规范，就可以创建出样式规则并且生效。

## 如何使用 

首先引入并初始化 rcss

```javascript
import rcss from 'rcss'

rcss.init()
```

在编写代码过程中，在 HTML 标签中书写 RCSS 预设的 class name 前缀加具体值就会产生效果。如下示例，

```html
<!-- 开发时用户编写的 class 名称 mb15 和 pb18 -->
<div class="mb15"></div>
<div class="pb18"></div>
```

```css
/* rcss 自动创建的规则 */
.mb15 { margin-bottom: 15px !important}
.pb18 { padding-bottom: 18px !important}
```

示例中 `mb`、`pb` 就是 RCSS 预设的 class name 前缀，`15`、`18` 则是对应的值，RCSS 通过解析这个 class name 动态创建出样式规则。

目前包含的前缀都是较常使用的几个样式，枚举如下：

前缀 | 样式规则
---- | ----
w | width
h | height
p | padding
m | margin
fz | font-size
lh | line-height
pt | padding-top
pr | padding-right
pl | padding-left
pb | padding-bottom
mt | margin-top
mr | margin-right
ml | margin-left
mb | margin-bottom

## 方案的实现原理

RCSS 的核心逻辑就是监听元素变化后创建样式规则。所以按步拆解，第一步是需要实现元素监听。

RCSS 通过使用 `MutationObserver` 实现元素监听。

```javascript
const observer = new MutationObserver(((mutationList) => {
  if (mutationList &amp;&amp; mutationList.length) {
    // mutationList 为 observer 监听返回的 record 记录
  }
}));

// 监听文档下所有元素的增删更新，属性仅监听 class 属性的更新
observer.observe(document, {
  subtree: true,
  childList: true,
  attributeFilter: ['class'],
});
```

再得到监听器 `observer` 反馈的监听记录时，RCSS 会识别每一条记录的类型及更新内容，不同的类型进行不同的操作，核心操作则是针对没有过的 class name 进行样式规则的创建。

```javascript
// 前缀与规则隐射关系
const usedCSSRules = {
  w: 'width',
  h: 'height',
  ...
};

function updateStyleSheetRules(className) {
  if (!className) {
    return;
  }
  // 从 class name 中提取三个要素：前缀、值和单位
  const result = /(\D+)(\d+)_?(\D+)?/ig.exec(className);
  if (!result) {
    return;
  }
  // 判断前缀是否匹配上
  if (Object.keys(usedCSSRules).indexOf(result[1]) === -1) {
    return;
  };

  const ruleName = usedCSSRules[result[1]];
  const value = result[2];
  const unit = result[3] || 'px';

  const ruleString = `.${className} {${ruleName}: ${value}${unit} !important}`;

  // 将 ruleString 添加到 style 标签中
}
```

这里注意到 RCSS 使用了 important 加强样式权重。这样做可以避免因为其他样式类的权重高于 RCSS 样式导致失效的问题。

## RCSS 的局限性

虽然 RCSS 具备诸如开发效率提升、支持运行时动态新增样式等优点，但也有它的局限性。

### 宿主环境的局限性

首先是宿主环境的特性依赖

RCSS 在运行时支持动态创建样式以达到减少样式编写并实时渲染的能力，其底层是基于浏览器解析 CSS 规则到 CSSOM 再生成渲染树的一系列浏览器内核的实时处理能力。

所以在非浏览器宿主环境，比如小程序、RN 下，需要一套全新的机制实现运行时实时处理能力，或者只能降级到舍弃运行时，在编译打包过程进行处理。

### 关于性能

目前方案虽然已经在项目中运行，但目前还没有足够的案例和数据以支撑该方案是足够安全、稳定、高效。

对于性能有利的地方是，样式文件体积可以减少；不利的地方则是运行时多了监听 DOM 变化执行动态样式处理的逻辑造成的性能消耗。

### 规则集覆盖的局限性

RCSS 并没有完全取代传统 CSS 编写方式的能力，动态创建规则集是基于 class name 的命名规范需要符合 RCSS 的预设前缀基础上。

目前 RCSS 仅预置了少量常用样式，包括 margin、padding、font-size 等。

在小型项目样式规则集可以固话的情况下，是可以尝试将有限的规则集全部由 RCSS 代理，但是并不能阻止也不应阻止开发者使用传统的 CSS 编写方式进行样式开发。

## 总结

实际已经憋不出几个字了。

RCSS 的方案从想法形成到项目中落地使用其实也有一段时间，主要的困境就是这个方案特别依赖浏览器这个宿主，是否有足够的价值加以落地。

怀揣着一份忐忑，希望大家能够多多提出宝贵意见。

谢谢
