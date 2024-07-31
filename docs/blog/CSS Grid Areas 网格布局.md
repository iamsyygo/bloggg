# CSS Grid Areas

A fresh look at the CSS grid template areas and how to take advantage of its full potential today.

##

CSS Grid support has been widely available since March 2017 in all major browsers. Yet, here we are in 2024, and I still see few people using the grid template areas feature.

It’s no surprise that many avoid template areas as making sense of the grid is challenging enough. In this interactive article, I aim to shed light on this feature and, hopefully, convince you to use it more often. Once you see the simplicity and power of template areas, you may reach for them much more frequently.

## [Introduction](https://ishadeed.com/article/css-grid-area/#introduction)

In the following example, we have a grid layout with three columns.

```css
.page {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
}
```
