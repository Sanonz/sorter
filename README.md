## Sorter
[Demo](http://sanonz.github.io/sorter/)

## 使用
```javascript
var sort = Sorter('.sorter-body', options);
```

### options
| key | value | type | description |
| --- | ----- | ---- | ----------- |
| vertical | bool | true | 是否开启上下移动 |
| horizontal | bool | true | 是否开启左右移动 |
| indentation | int | 30 | 缩进距离(px) |
| maxDepth | int | 0 | 向右移动的最大深度 |
| borderWidth | int | 2 | 边框宽度 |
| dataDepth | string | data-sorter-depth | 边框宽度 |
| rowClassName | string | sorter-row | 边框宽度 |
| depthClassName | string | sorter-depth- | 边框宽度 |
| heplerClassName | string | sorter-helper | 边框宽度 |
| sublistClassName | string | sorter-sublist | 边框宽度 |
| placeholderClassName | string | sorter-placeholder | 边框宽度 |
| onStart | function | null | 监听开始 |
| onMove | function | null | 监听移动 |
| onEnd | function | null | 监听结束 |
