---
title: "開始使用"
description: "安裝 @linyao.tw/ui、載入樣式、設定語系與主題。"
---

`@linyao.tw/ui` 是麟曜數位工作室的 React 元件與設計規範套件。所有產品的介面都由它提供，不再另外引入第二套元件庫。

## 安裝

```sh
pnpm add @linyao.tw/ui
```

peer dependency 需要一起裝：

```sh
pnpm add react react-dom @phosphor-icons/react
```

| 套件                    | 版本    |
| ----------------------- | ------- |
| `react`                 | ^19.0.0 |
| `react-dom`             | ^19.0.0 |
| `@phosphor-icons/react` | ^2.1.10 |

## 載入樣式

在應用程式入口匯入一次：

```tsx
import "@linyao.tw/ui/fonts.css"; // 選用，品牌字型
import "@linyao.tw/ui/styles.css"; // 必要
```

公開的樣式入口只有這兩個。

:::danger[不要從 dist 或 src 匯入]

`@linyao.tw/ui/dist/**`、`src/**` 與任何內部 CSS 路徑都不是公開介面，版本升級時會無預警改變。

:::

`styles.css` 不載入任何遠端資源，因此離線環境與封閉網路都能正常顯示。字型是獨立的可選入口，不需要品牌字型時不必付出那份下載成本。

詳細說明見[主題](/ui/theming)。

## 設定 Provider

`LinyaoProvider` 一次設定語系、翻譯與書寫方向，包在應用程式最外層：

```tsx
import { LinyaoProvider } from "@linyao.tw/ui";

export function AppProviders({ children }: { children: React.ReactNode }) {
	return <LinyaoProvider locale="zh-TW">{children}</LinyaoProvider>;
}
```

內建 `zh-TW` 與 `en-US` 兩組訊息。要自訂個別字串時用 `MessagesProvider`，細節見[元件](/ui/components)的在地化一節。

## 切換主題

主題由根元素的 `data-lyds-theme` 屬性決定：

```ts
document.documentElement.setAttribute("data-lyds-theme", "dark");
```

亮色與深色共用同一份元件 CSS，切換時只有語意變數被重新指定，不需要重新載入樣式表，也不需要重新掛載元件。

:::warning[首次繪製會閃一下]

主題如果等到 React 掛載才設定，使用者會先看到預設主題再跳成實際主題。把讀取偏好與設定屬性的那幾行放進 `<head>` 的同步 script 就不會閃。

:::

完整做法見[主題](/ui/theming)。

## 使用元件

```tsx
import { Button, TextField } from "@linyao.tw/ui";

export function LoginForm() {
	return (
		<form>
			<TextField label="電子郵件" type="email" required />
			<Button type="submit">登入</Button>
		</form>
	);
}
```

所有元件都從套件根匯入，沒有深層路徑。完整清單見[元件](/ui/components)。

## 設計規範

寫介面之前建議先讀這兩份：

- [設計原則](/ui/design-principles)：元件結構、色彩、字體與互動的依據。
- [設計變數](/ui/tokens)：可以用哪些變數，以及什麼時候該用語意角色而不是色盤。

顏色、間距、圓角與字級一律使用套件提供的設計變數，不要寫死色碼或 px。套件沒有提供的版面容器可以自己寫 CSS，但值必須取自設計變數。
