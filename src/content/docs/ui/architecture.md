---
title: "架構"
description: "工作區結構、公開套件邊界、行為層級與依賴規則。"
---

Linyao Design System 採 pnpm 單一儲存庫架構，對外只提供 `@linyao.tw/ui`。使用者安裝一個套件即可取得 React 元件、TypeScript 型別與 CSS；Storybook、測試與發佈流程使用相同的公開邊界。

## 工作區結構

```text
/
├─ apps/
│  └─ storybook/       # 審閱與文件，不發佈
├─ packages/
│  └─ ui/              # 唯一預計公開的 npm 套件
├─ docs/               # 架構、設計、使用與發佈規則
├─ skills/
│  └─ lyds-ui/         # coding-agent skill 原始檔
├─ scripts/            # 儲存庫與 tarball 驗證工具
└─ .github/workflows/  # CI 與受開關保護的發佈流程
```

根目錄與 `apps/storybook` 的套件均為 `private: true`。只有 `packages/ui` 對應 `@linyao.tw/ui`。

## 公開套件邊界

公開使用方式：

```tsx
import { Button, DatePicker } from "@linyao.tw/ui";
import "@linyao.tw/ui/styles.css";
```

`packages/ui/package.json` 的 `exports` 是公開 API 的依據。`src/**`、測試工具、內部工具與建置設定均不是公開 API。`files` 白名單與 `pnpm pack:check` 會限制 tarball 內容。

CSS 標記為 side effect，避免正式建置的 tree shaking 移除樣式。建置必須輸出 ESM JavaScript、TypeScript 宣告與 `dist/styles.css`。

建置會為每個輸出模組加上 `"use client"`（`vite.config.ts` 的 `output.banner`）。套件內每個模組都渲染互動介面——讀取 context、持有狀態，或呼叫 Base UI 的 hook——因此整包都在用戶端邊界之後。少了這個指示詞，任何從根 barrel 匯入的 Server Component 都會把整張依賴圖（含在模組頂層呼叫 `createContext` 的 `intl/provider`）拉到伺服器並失敗。`preserveModules` 讓每個原始檔各自輸出，banner 因此標記到每一個檔案而不是單一入口。Storybook 只能透過 `@linyao.tw/ui` 工作區依賴使用套件，不得以跨套件相對路徑匯入原始碼。

目前使用單一根目錄匯出。只有在 bundle 分析證明有需要、子路徑有穩定維護邊界、型別與 CSS side effects 可測試，而且不會暴露內部檔案結構時，才新增元件子路徑匯出。

## 行為層級

```text
產品狀態與業務規則
        ↓
Linyao Design System 元件 API 與樣式
        ↓
Base UI 基礎元件         React Aria Components
（一般元件行為）         （日期與時間行為）
        ↓
React、瀏覽器平台與 Intl
```

### Base UI

Base UI 負責按鈕、選取、選單、浮層、展開元件與導覽等一般互動。Linyao Design System 保留其焦點管理、鍵盤互動、ARIA 關聯與受控／非受控模式，再加入一致的 API、元件結構與語意 CSS。

不得重新實作 Base UI 已處理的巡迴焦點、Escape 關閉、焦點限制、焦點返回或彈出元件定位。

### 日期與時間

Base UI 不提供完整的日期元件，因此日期與時間元件使用：

- `react-aria-components`：日曆格線、日期區段、範圍選取、鍵盤導覽、依地區設定調整的 ARIA 與焦點行為。
- `@internationalized/date`：`CalendarDate`、`CalendarDateTime`、`ZonedDateTime`、日期運算與時區明確的值型別。

這兩項依賴只負責日期邏輯與行為。可見介面、設計變數、間距與狀態仍由 Linyao Design System 控制。其他元件不得只為方便而引入 React Aria Components。

### 圖示

`@phosphor-icons/react` 是唯一標準介面圖示套件。它是 `@linyao.tw/ui` 的同儕依賴，也是套件與 Storybook 的開發依賴。建置時會將 Phosphor 設為外部依賴，不把整套圖示庫包入 `@linyao.tw/ui`。

套件原始碼、Storybook 與一般用戶端元件使用個別 `/dist/csr/<Name>` 匯出；React Server Components 使用 `/ssr`。品牌標誌、插圖與資料視覺化不屬於介面圖示，但仍需設計審核；不得用手寫 JSX SVG、Unicode 字形或 CSS 偽元素圖示取代既有圖示。

## 組合模型

元件只有三種對外形狀，選哪一種取決於元件本身的結構，不取決於寫的時間：

1. **只有屬性。** 沒有內部結構的元件（`Button`、`Badge`、`TextField`）只暴露屬性，不提供 parts。
2. **Parts namespace。** 建立在 context root 上的元件（`Dialog`、`Drawer`、`Tabs`、`Accordion`、`Popover`、`Menu`、`Select`、`Combobox`、`CommandPalette`）同時提供 namespace 物件與扁平具名匯出。文件與範例一律使用 namespace 形式：

   ```tsx
   <Dialog.Root>
   	<Dialog.Popup>…</Dialog.Popup>
   </Dialog.Root>
   ```

3. **可呼叫的預設編排 + parts。** 當單一編排能涵蓋多數情境時（`Select`、`Combobox`、`Autocomplete`），元件本身可直接以 `options` 呼叫，parts 仍保留給需要完全控制的情況。

沒有共用 root 的語意包裝（`Table`、`Breadcrumb`、`Pagination`、`Collection`、`Header`、`TabBar`）只提供扁平匯出。它們的各部位彼此獨立、不共用 context，硬掛上 namespace 只會製造「有 root」的錯覺。

別名（`Modal` 之於 `Dialog`、`AlertView` 之於 `Alert`、`List*` 之於 `Collection*`、`SegmentedControlItem` 之於 `Toggle`）必須是同一個物件，並由測試斷言其同一性。新增別名前先確認名稱差異真的有意義。

## API 規則

相同概念使用相同名稱：

- `variant`：語意或視覺層級，例如 `primary`、`secondary`、`neutral`、`quiet`、`danger`。
- `size`：主要使用 `sm`、`md`、`lg`。
- `orientation`：只用於需要水平或垂直方向的元件。
- `disabled`、`readOnly`、`required`、`invalid`、`loading`：映射至底層基礎元件。
- `value`／`defaultValue`／`onValueChange`：受控／非受控值。
- `open`／`defaultOpen`／`onOpenChange`：浮層與展開元件狀態。
- `className`、`style`、`render` 或元件 parts：支援組合，不暴露內部樣式細節。

`name`、`min`、`max`、`step` 等 HTML 屬性應正確傳遞。Ref 應指向最有用的互動或根元素。可安全繼承底層型別時，不應複製 props 清單。

## 產品邏輯邊界

下列責任由應用程式處理：

- API 呼叫、server actions、快取與樂觀更新。
- 路由導覽、權限與分析。
- localStorage、cookie 或主題保存。
- 領域驗證、貨幣／日期業務規則與資料轉換。
- DataTable 排序、篩選、分頁資料來源與虛擬化規則。
- 檔案上傳端點、multipart 協定、病毒掃描與重試規則。
- Toast 文案、錯誤代碼映射與通知去重複。

元件可提供回呼、render slot 與組合 parts，但不決定回呼的業務效果。

## CSS 架構

`styles.css` 是唯一必要的樣式入口，順序為：

1. 最小基準樣式；
2. 色盤、字體、間距、形狀、動態效果、z-index 等基礎設計變數；
3. 亮色／深色語意值；
4. 共用工具類別；
5. 元件結構與狀態 selectors。

字型由獨立的可選入口 `fonts.css` 提供，因此 `styles.css` 不含任何跨來源請求；CSP、離線環境與自行代管字型都不需要分支處理。

### 浮層堆疊

會 portal 到 `body` 的表面共用同一個 `--z-floating`，不各自佔一階。每一種浮層都可能從另一種裡面被開啟——Dialog 裡的 Select 必須蓋過該 Dialog，而從 Popover 裡開啟的 Dialog 必須蓋過該 Popover——所以任何固定階梯必然在其中一個方向出錯。React 依掛載順序 append 每個 portal，文件順序本身就記錄了開啟順序；backdrop 永遠是它所遮蔽的 popup 在同一個 portal 內的前一個兄弟節點。共用一個值就讓這個順序決定疊放。

`--z-toast` 與 `--z-tooltip` 刻意高於這個層：Dialog 開啟時發出的 toast 仍須可讀，tooltip 則可能掛在上述任何表面內的控制項上。`--z-base` 與 `--z-sticky` 給留在文件流內的元素。

`--z-dropdown`、`--z-popover`、`--z-overlay`、`--z-modal` 保留為指向 `--z-floating` 的別名，讓既有覆寫不會失效；單獨覆寫其中一個會重新製造原本的問題。

元件 CSS 一律使用全域 `lyds-*` 類別，不使用 CSS Modules。使用端因此能以一致的方式檢視、覆寫與偵錯任何元件，型別也不需要靠手寫的 `*.css.d.ts` 維護。命名為 `lyds-<元件>`、`lyds-<元件>__<部位>`、`lyds-<元件>--<變體>`；跨元件共用的部位使用共通字首（例如 Select、Combobox 與 Autocomplete 的清單共用 `lyds-listbox__*`）。

所有元件顏色必須使用語意變數。固定長度必須來自設計變數，由 `pnpm lint:css` 強制檢查；只有 1px 細線或分隔線可使用 `px`。流動版面可使用 `%`、`fr`、viewport units 或無單位行高。

全域基準樣式限定為 box-sizing 與 margin／padding 歸零、`body` 的背景／文字色／字體、表單控制項的 `font: inherit`、`::selection`，以及列印色彩。全部包在 `@layer lyds.base` 內：

```css
@layer lyds.base {
	*,
	*::before,
	*::after {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	body {
		background: var(--background-main);
		color: var(--text-main);
		/* … */
	}
}
```

未分層的樣式一律勝過分層樣式，因此使用端不需要靠選擇器權重就能覆寫這層基準；元件庫不應該讓應用程式為了改自己的 `body` 而提高權重。設計變數、元件樣式與 `.lyds-*` 工具類別維持未分層，行為與過去一致。

新增全域正規化前必須說明具體的相容性問題，不加入完整且具版面偏好的 CSS reset。

## 依賴規則

新增正式環境依賴前必須確認：

1. 瀏覽器、React、Base UI 或現有日期依賴無法可靠完成需求；
2. 依賴只提供邏輯／headless 行為，不是另一套樣式化元件系統；
3. bundle、tree shaking、型別、SSR 與授權可接受；
4. 不包含業務假設；
5. 在架構或元件文件記錄原因。

不得加入 MUI、Chakra UI、Mantine、Ant Design 或另一套樣式執行環境。GSAP 不得成為 `@linyao.tw/ui` 執行期依賴；一般動態效果使用設計變數控制的 CSS transition／animation。

## 驗證範圍

`pnpm check` 必須涵蓋格式、lint、型別檢查、測試、套件建置與 Storybook 建置；`pnpm pack:check` 驗證實際 npm tarball。`pnpm lint` 內含 `lint:css`（語意色彩、已宣告的變數、代幣化長度與堆疊）與 `lint:contrast`（對兩個主題計算具名配對的 WCAG 對比）。可見介面變更還需在 Storybook 檢查桌面、行動裝置、亮色、深色、鍵盤操作與減少動態效果。

原始碼可編譯不代表套件可使用；Storybook 可顯示也不代表公開匯出與 tarball 正確。兩項都必須驗證。
