# 雞雞與米粉的小房間

毛絨雞雞、米粉與熊熊毯毯的互動 3D 小房間，使用 Three.js WebGPU，並提供 WebGL 2 相容模式。

網站：https://wesley1110.github.io/jiji-mifen-room/

此專案是獨立的 GitHub Pages 專案，與 `Wesley1110.github.io` 學術網站分開部署。

## 操作

- 拖曳環繞、滾輪拉近／拉遠。
- WASD 進入自由飛行並移動，Shift 加速，Q／E 下降／上升。
- 自由飛行時拖曳轉向，滾輪沿視線前後移動。
- 點門把開門，可走入走廊並返回房間。
- 選單可縮小或隱藏；按 M 隱藏／恢復。
- 手機支援觸控及飛行方向按鈕。

## 部署與資產

GitHub Pages 使用 `main` 分支的根目錄，`.nojekyll` 保留原始靜態檔案。所有執行所需的程式與模型均包含在此專案中，使用相對路徑支援 `/jiji-mifen-room/` 網址。

模型源自本機 Blender v11 場景；毛絨採網頁即時渲染。毛絲資料分為十個二進位檔，瀏覽器載入後完整重組。原始 Blender 檔、參考圖片與本機歷史備份未包含在此專案。

Three.js 授權見 [vendor/THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)。
