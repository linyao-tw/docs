---
title: "主題"
description: "以語意變數定義主題；亮色、深色與自訂主題共用同一份元件 CSS。"
---

Linyao Design System 以語意變數定義主題。所有主題共用相同的元件 CSS；亮色、深色或自訂主題只重新指定角色變數。

## 載入樣式

在應用程式入口匯入一次：

```tsx
import "@linyao.tw/ui/styles.css";
```

不得從 `@linyao.tw/ui/dist/**`、`src/**` 或內部 CSS 路徑匯入。公開樣式入口只有兩個：必要的 `@linyao.tw/ui/styles.css`，以及可選的 `@linyao.tw/ui/fonts.css`。

### 字型

`styles.css` 不載入任何遠端資源。品牌字型是獨立的可選入口：

```tsx
import "@linyao.tw/ui/fonts.css"; // 選用
import "@linyao.tw/ui/styles.css";
```

`fonts.css` 會向 `font.emtech.cc` 與 `fonts.gstatic.com` 發出三個跨來源請求。正式環境建議自行代管相同字型，並覆寫 `--font-family-sans`、`--font-family-serif` 與 `--font-family-mono` 指向自己的 `@font-face`；設計變數本身已帶有系統字型備援，未載入 `fonts.css` 時元件仍可正常呈現。

不匯入 `fonts.css` 的理由通常是：Content Security Policy 未允許這兩個網域、離線或內網環境無法連線，或需要避免 CSS `@import` 造成的串行阻塞。

## 選擇主題

亮色是 `:root` 預設，也可明確指定：

```html
<html data-lyds-theme="light"></html>
```

深色：

```html
<html data-lyds-theme="dark"></html>
```

主題也可套在子樹：

```tsx
<main data-lyds-theme="light">
	<Preview />
	<aside data-lyds-theme="dark">
		<DarkPreview />
	</aside>
</main>
```

一般應用程式應將主題設在文件根元素。`Select`、`Combobox`、`Menu`、`Tooltip`、`Dialog`、`DatePicker` 等浮層元件預設透過 portal 呈現在 `body`，會依 portal 目的節點的祖先元素取得設計變數。若主題只套在子樹，portal 容器也必須位於相同主題範圍。

每個主題範圍同時設定對應的 `color-scheme`，使瀏覽器原生控制項與 Linyao Design System 表面一致。

## 主題狀態

主題狀態由應用程式管理。Linyao Design System 不讀取系統偏好、不寫入 localStorage，也不建立全域 React context。

```tsx
type LydsTheme = "light" | "dark";

export function AppTheme({ theme, children }: React.PropsWithChildren<{ theme: LydsTheme }>) {
	document.documentElement.dataset.lydsTheme = theme;
	return children;
}
```

需要跟隨系統時，應用程式可使用 `matchMedia("(prefers-color-scheme: dark)")`。需要保存設定時，由應用程式選擇 cookie、伺服器設定或 localStorage。

### 首次繪製

SSR 的伺服器標記與用戶端第一次 render 必須使用相同主題。若只能在瀏覽器決定，可由應用程式在 hydration 前設定 `document.documentElement.dataset.lydsTheme`。Linyao Design System 不注入此程式，因為儲存方式、CSP、nonce 與系統偏好都屬於產品設定。

## 淺色主題

```text
Limestone
├─ Background/Main       暖白主背景
├─ Background/Secondary  清單與相鄰表面
├─ Background/Elevated   浮動表面
├─ Background/Inset      群組控制項表面
└─ Background/Sunken     次要表面

Charcoal
├─ Text/Title 與 Text/Main
├─ 圖示
└─ 低對比分隔線

Vermilion
├─ primary action
├─ 選取／勾選
└─ 必要的狀態強調
```

表面層級主要透過明度、選取底板與結構性分隔線表達。陰影只用於浮動元件或浮層元件。Vermilion 上的文字使用 `OnAccent` 語意值。

## 深色主題

- `Background/Main` 約為 `oklch(0.18 0.008 75)` 的暖色近黑。
- `Background/Secondary` 與 `Background/Elevated` 逐層提高明度。
- `Background/Inset`／`Sunken` 保留群組層級，不使用單一純黑背景。
- `Text/Main` 使用 Limestone／暖色中性色系。
- Vermilion 保留主要操作與選取角色，不加入 neon glow。
- 細線與陰影依深色主題重新指定，不直接反轉亮色主題值。

深色色盤、語意設定與動態效果是 Linyao Design System 的設計，不是 Modulor 公開 Figma 元件庫的原始內容。

## 自訂主題

### 覆寫語意變數

使用 class 或 data attribute 覆寫語意角色：

```css
.operations-theme {
	--background-main: oklch(88% 0.018 82);
	--background-secondary: oklch(92% 0.014 82);
	--text-main: oklch(35% 0.01 82);
	--control-primary: var(--palette-signal-600);
	--control-primary-hover: var(--palette-signal-700);
	--control-primary-pressed: var(--palette-signal-800);
	--control-on-primary: var(--palette-warm-25);
	--focus-ring: oklch(48% 0.17 32);
}
```

```tsx
<section className="operations-theme" data-lyds-theme="light">
	<AccountSettings />
</section>
```

完整自訂主題必須覆寫語意角色，不能只修改 `--palette-vermilion`。元件不直接使用色盤變數。

### 使用語意角色

建議：

```css
.billing-surface {
	--control-primary: var(--billing-action);
}
```

不建議：

```css
.billing-surface .lyds-button[data-variant="primary"] {
	background: #e04010;
}
```

直接覆寫 `.lyds-*` 會略過 hover、按下、停用、深色主題與未來內部變更。若現有語意角色無法完成合理的自訂，應先提出設計變數調整，不要分支修改元件 CSS。

### 版面調整

`className` 與 `style` 用於應用程式控制的位置、寬度與 grid／flex 關係：

```tsx
<DatePicker className="checkout-delivery-date" label="交付日期" />
```

```css
.checkout-delivery-date {
	inline-size: min(100%, 24rem);
}
```

不要以 `style` 傳入元件原始色值。需要從 React 動態傳入設計變數時，使用 CSS custom property 與可檢查的型別包裝。

## 主題驗證

每個主題都必須檢查：

- 內文、標題、次要、停用與連結文字；
- primary、secondary、quiet、danger 操作；
- 輸入元件預設／hover／焦點／無效／唯讀／停用；
- 選取／勾選控制項；
- popup、dialog、drawer、bottom sheet、backdrop；
- Toast／狀態表面；
- 日期選取／範圍／今天／不可用狀態；
- `focus-visible`、鍵盤順序與焦點返回；
- 繁體中文與英文混合的長文字；
- 200% zoom 與窄螢幕；
- `prefers-reduced-motion: reduce`；
- 產品需要列印時的 print colors。

修改主題不應造成版面位移。語意值改變時，元件尺寸、互動目標與文字換行應保持一致。

## 對比責任

內建主題以 WCAG 2.2 AA 為目標。使用者覆寫主題後，必須重新驗證：

- 前景色與合成後背景；
- 焦點指示器與控制項／相鄰表面；
- 非文字控制項邊界；
- hover／按下／選取狀態；
- 停用狀態的可讀性。

品牌原色不保證符合對比。Limestone、Charcoal 與 white 都不適合直接作為 Vermilion 上的一般尺寸文字。品牌強調表面應使用 `--text-on-accent`；需要近白前景的主要控制項，應同時使用較深的 `--control-primary` 與 `--control-on-primary`。
