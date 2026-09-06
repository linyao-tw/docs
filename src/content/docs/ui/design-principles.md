---
title: "設計原則"
description: "元件結構、色彩、字體、圖示與互動的依據。"
---

Linyao Design System 的元件結構、尺寸、`variant` 與互動狀態以 Modulor Figma 可驗證的設計為依據。主要差異是麟曜數位工作室的色盤、字體，以及 Web 與 WCAG 2.2 AA 所需的狀態。Figma 未提供的元件使用相同的表面、圓角、字級、間距與狀態規則。

## Modulor 依據

研究來源是公開 Figma 檔案「❖ Modulor・Components (Community)」。`1277:150465` 是 **Start Here** 畫布，不是單一元件。實作時先依階層定位 Glossary、可見範例、元件集、variants 與 variables，再檢查個別元件的設計內容；截圖只用於交叉檢查。

| 範圍                    | Figma nodes                             | 採用規格                                                                 |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Glossary／結構          | `26014:40556`, `1277:150465`            | 元件分類、組合規則、公開頁面邊界                                         |
| Button regular          | `16469:37879`–`16469:37882`             | 高 `3.5rem`、圓角 `0.75rem`、16/20 semibold、無邊框與陰影                |
| Checkbox／Radio／Switch | `204:69822`                             | 12 種狀態；24px 控制項；52×30px switch 與 28px knob                      |
| Segmented control       | `234:61252`, `224:61156`                | 2–6 個選項、medium／small、共用表面與選取底板                            |
| Tabs                    | `9457:23922`, `1009:124555`             | 2rem 內容寬度項目、0.25rem 間距、active quaternary surface、無軌道或底線 |
| Text fields             | `132:59432`, `709:93524`, `740:98259`   | 56px 欄位、12px 圓角、1px 外框、浮動標籤與錯誤結構                       |
| Code／Phone fields      | `9297:23908`, `10703:28303`             | 56px 分段欄位、8px 間距、電話國家區段寬度                                |
| List／Section heading   | `9457:29047`–`9457:29056`               | 56px 列、內縮 0.5px 分隔線；32px 大寫區段標題                            |
| Bottom Sheet            | `9457:26270`, `2589:10397`–`2589:10405` | 表面、把手、導覽、固定操作區、分隔線與行動裝置安全區域                   |

已驗證的 Modulor 命名包含 `Background/Main`、`Background/Secondary`、`Text/Title`、`Text/Body`、`Icon/Main`、`Divider/Main`、`Control/Primary`、`Control/Secondary`、`Control/Quaternary`、switch 狀態角色與 `Radius/md`。Linyao Design System 依類別／角色／狀態建立固定的 CSS 變數名稱，元件不直接使用實體色票。

Figma MCP 無法直接讀取未放在可見畫布的隱藏母元件。Button low 沒有可驗證範例，因此不宣稱是 1:1 複刻。深色主題、Web hover／焦點狀態與 Figma 未提供的元件依已驗證規則延伸，並另外進行可存取性與瀏覽器驗證。

## 元件結構

### 元件分類

Checkbox、Radio、Switch 共用選取規則；SegmentedControl 由等寬項目組成；Tabs 使用依內容寬度排列的項目。浮層元件由 Root、Trigger、Portal、Backdrop、Popup、Title、Description 與 Close 等 parts 組合。

### 元件狀態

每個互動元件按適用情況檢查預設、hover、按下、`focus-visible`、選取／勾選、開啟、停用、唯讀、載入與無效狀態。Storybook 顯示實際狀態；測試驗證鍵盤、焦點、開關與受控／非受控行為。

### 語意變數

元件 CSS 使用 `--text-main`、`--control-primary-hover`、`--divider-main`，不使用色名或元件內部十六進位色碼。同一元件可在亮色、深色與使用者自訂主題中維持相同角色。

### 表面與尺寸

使用下列規格：

- main、secondary、elevated 與 quaternary 表面；
- 只在結構需要時使用低對比細分隔線；
- 核心 radius 為 `0.75rem`；
- 選取底板、switch knob 與低對比陰影；
- 32／40／56px 控制項高度；
- 清楚的 title／body／caption 層級。

不得加入裝飾性切角、假序號、背景工程網格、面板刻紋、內凹接縫或全站 uppercase。沒有元件結構或互動用途的細節不應加入。

## 色彩

### 淺色主題

亮色主題使用接近 Modulor `Background/Main` 的暖白作為主背景。Limestone 衍生色用於 secondary／quaternary 表面；Charcoal 衍生色用於文字與圖示；Vermilion 取代 Modulor blue，作為主要操作、選取與勾選狀態。

### 深色主題

深色主題保留相同的元件結構與間距，以暖色近黑、逐層變亮的表面與 Limestone 文字建立層級。Vermilion 保留強調角色，不使用霓虹光暈。

### 強調色與狀態色

Vermilion 用於主要操作、選取／勾選狀態與必要指示器。危險操作使用獨立語意變數，不與主要操作共用角色。Vermilion 上的一般尺寸文字使用通過對比檢查的深色 `OnAccent`，不直接使用白色。

## 字體

- `GenKiGothicTW`：一般 UI 無襯線字體。
- `GenKiMinTW`：由產品控制的編輯內容。
- `Geist Mono`：程式碼、日期／時間、計數器、計時器與數值。
- SectionHeading 的大寫只用於 Figma 明確顯示的 12／16 說明文字。
- 日期、時間與數值欄位使用 tabular numerals。

## 圖示

介面圖示統一使用 Phosphor。Button、欄位、選單與日曆導覽的圖示由元件控制尺寸並繼承語意前景色。預設使用 regular／bold；只有勾選／選取狀態在語意需要時使用 fill。圖示不取代可見的狀態文字，也不得以手寫 SVG、Unicode 字元或 CSS 圖形代替。

## 互動

可操作狀態透過 hover／按下表面、選取底板、knob 位置、短時間動態效果與焦點回饋表達。不使用厚邊框、硬陰影、位移刻線或面板裝飾表達互動。

所有元件必須：

- 支援長文字與地區語言擴展；
- 在窄螢幕不造成頁面 overflow；
- 維持至少 44px 互動目標，或提供等效點擊區域；
- 清楚區分驗證、停用與唯讀；
- 支援完整鍵盤操作；
- 在減少動態效果下仍能辨識狀態變化。

## 可存取性

Linyao Design System 以 WCAG 2.2 AA 為目標。Figma 的尺寸與結構是視覺依據；若原始配色不符合一般 Web 文字對比，會保留語意角色並改用可存取的前景色，例如 Vermilion 上使用深色 `OnAccent`。

`focus-visible` 不能只以低對比陰影表示；選取、無效與狀態不能只依賴顏色；停用內容仍應可讀。一般 transition 使用動態效果變數，`prefers-reduced-motion: reduce` 時移除非必要的距離與時間。
