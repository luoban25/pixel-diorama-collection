# 像素微缩场景 · Pixel Diorama Collection

[在线浏览街头篮球](https://luoban25.github.io/pixel-diorama-collection/?scene=basketball) · [全部场景](https://luoban25.github.io/pixel-diorama-collection/)

四个独立保存的 Three.js 等距微缩场景。白色背景、固定正交相机，页面仅保留底部场景切换。

- **街头篮球**：旧蓝色球场、街角商店与贩卖机、树木、铁丝围栏和由像素 X 簇拥渐隐的边缘。六名球员服装各异，两边交替运球、起跳投篮、接球与反弹回传，配合接应跑动和防守移动；四位观众有独立休闲穿搭。
- **西部列车**：红岩荒漠、石拱、木桥峡谷、蒸汽列车、六名奔马骑手、风车和水塔；12 秒循环动画。
- **钓鱼池塘**：秋色树木、蓝色池水、游鱼与涟漪，两名人物每隔 3 秒触发钓鱼动作。
- **板球场**：条纹草坪、球场、球员、围栏、树木、灯架与木制看台。

![街头篮球场景](previews/basketball.png)

## 直接打开

GitHub Pages 上可直接浏览，无需登录。也可以下载仓库中的 `index.html`，在支持 WebGL 2 的现代浏览器中打开；所有场景、纹理和 Three.js 代码均已内嵌，离线可用。

独立页面位于 `scenes/cricket/`、`scenes/pond/`、`scenes/western/`、`scenes/basketball/`。使用 `?scene=western`、`?scene=pond`、`?scene=cricket`、`?scene=basketball` 可直接选择项目。

## 源码与重建

需要 Node.js 20 或更新版本：

```sh
npm ci
npm run build
npm run dev
```

构建会更新自包含的根页面和四个独立页面。提交生成的页面到 `main` 后，GitHub Pages 从仓库根目录发布。

- `projects/cricket/src/`：板球场。
- `projects/pond/src/`：秋色钓鱼池塘。
- `projects/western/src/`：西部列车、地貌与骑手。
- `projects/basketball/src/`：街头篮球、碎边地表、商店、树木与人物。
- `src/gallery.html`、`src/scene-shell.html`：极简切换页面与渲染器模板。

未激活的场景停止动画；适配窄屏，并遵循系统减少动态效果偏好。

## 来源

场景几何与纹理由程序生成。Three.js r180 使用 MIT 许可，许可随构建页面内嵌，并保留于 [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt)。渲染技术参考与视觉来源见 [SOURCES.md](SOURCES.md)。参考图片未打包进仓库。
