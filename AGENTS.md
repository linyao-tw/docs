# 麟曜數位工作室文件站

這個 repository 是麟曜數位工作室**所有產品**的說明文件，線上位置是 <https://docs.linyao.tw>，服務在根路徑。

單一 Astro 靜態站台，每個產品佔一段網址：`/huan/**`、`/ui/**`。首頁是產品清單，沒有行銷內容。

## 專案總覽

- 產品語言：繁體中文（zh-TW）。所有文案、文件與 commit 訊息說明都用繁體中文。
- 程式碼識別字、型別名稱、函式名稱一律使用英文。
- 套件管理器：**pnpm**。不要使用 npm 或 yarn；`preinstall` 會擋下來。
- 設計系統：**`@linyao.tw/ui`**。不得引入第二套元件庫。

## 常用指令

```sh
pnpm install       # 安裝相依套件
pnpm dev           # 開發伺服器（搜尋不可用，索引要建置後才有）
pnpm build         # SSG 建置到 dist/，並產生 Pagefind 索引
pnpm preview       # 預覽建置結果
pnpm typecheck     # astro check
pnpm format        # Prettier
pnpm format:check  # CI 跑的那一個
```

## 架構

```text
src/
  content/docs/<product>/**   每個產品一個目錄，目錄名就是網址的第一段
  lib/products.ts             產品清單與導覽的共用函式
  lib/nav/<product>.ts        單一產品的側欄結構
  layouts/DocsLayout.astro    文件頁版面
  components/                 .astro 版面元件，兩個 React island
  pages/                      路由與 llms.txt / .md 端點
  plugins/                    remark 外掛
  scripts/                    瀏覽器端的原生 TS
  styles/docs.css             全站樣式，只用設計變數
public/<product>/**           該產品的圖片，例如 public/huan/screenshots/
```

### 新增一個產品

三件事，缺一不可：

1. 內容放進 `src/content/docs/<id>/`，每一篇都要有 `title` 與 `description` frontmatter。
2. 建立 `src/lib/nav/<id>.ts`，匯出 `Section[]`。
3. 在 `src/lib/products.ts` 的 `PRODUCTS` 加一筆。

順序就是產品切換器與首頁的顯示順序。圖片放 `public/<id>/`，不要放在 `public/` 根目錄——兩個產品遲早會有同名的 `overview.png`。

### 一個產品可以有多個區塊

`Section` 是產品內部的分區。HUAN 有兩個（使用教學／開發者），因此頁首會出現區塊切換器；設計系統只有一個，切換器就不會出現。上一頁／下一頁**不跨區塊、也不跨產品**串接——使用教學的讀者不會想在最後一頁被送進 ADR。

## React 的使用界線

站台是靜態的，React 只為了用 `@linyao.tw/ui` 的元件而存在。

- **需要自己管狀態的才是 island**：目前只有產品切換器（`Select`）與搜尋（`CommandPalette`）兩個，都用 `client:idle`。
- **不需要互動的元件不要加 `client:*`**：首頁的 `Card` 在建置時就變成 HTML，那一頁完全不含 React。
- **互動邏輯用原生 TS**：目錄、程式碼複製、表格提示、圖表與側欄都在 `src/scripts/docs.ts`，不要為了這些把它們改寫成元件。

## 客戶端導覽

站台開著 `<ClientRouter />`，換頁時只換 `<main>`。這讓 React runtime 與 Pagefind 索引整個瀏覽階段只載入一次，但也帶來兩個必須遵守的規則：

1. **頁面初始化掛在 `astro:page-load`，不要直接呼叫。** 模組腳本一輩子只會被求值一次，直接呼叫的話第二頁開始就再也不會被接上。
2. **不要在 `document` 或 `window` 上重複掛監聽器。** 那些不會跟著舊頁面被丟掉。要跟著視窗變動重算的東西登記到 `measureOnResize()`，它每頁清空一次；跟著單一節點的用 `ResizeObserver`。

## 程式碼規範

### 格式

Prettier 設定已經存在，**不要修改**：tab 縮排、`printWidth: 200`、雙引號、不加尾逗號、`arrowParens: "avoid"`。送出前跑 `pnpm format`。

### TypeScript

- `strict`。不使用 `any`，真的需要未知型別時用 `unknown` 並在使用點收斂。
- 不用 `as unknown as T` 繞過型別系統。
- 編譯錯誤要修，不要關掉型別檢查。

### Import 規範

**絕對不要跨層級相對匯入。** `@/` 別名指向 `src/`，由 Astro 與 `tsconfig.json` 的 `paths` 同時設定：

```ts
import { PRODUCTS } from "@/lib/products"; // ✓
import { PRODUCTS } from "../../lib/products"; // ✗
```

### 註解

註解解釋「為什麼」，不解釋「做什麼」。要寫的是「為什麼這裡不能用 background 畫提示」、「為什麼這個監聽器只能掛一次」。

### 樣式

`src/styles/docs.css` 匯入 `@linyao.tw/ui` 的 `styles.css` 之後，**只用語意角色**（`--background-main`、`--text-secondary`、`--space-4`…）作版面，沒有任何色碼或自訂刻度。主題切 `data-lyds-theme`，和產品端同一套機制。

React island 的樣式也寫在 `docs.css`，不要寫成 `.astro` 的 scoped style——scoped style 加的雜湊屬性不會出現在 React 產生的節點上，寫了不會生效。

## 寫作規範

- 每一頁都要有 `title` 與 `description` frontmatter。`description` 會進 meta 標籤、`llms.txt` 與搜尋結果。
- 版面已經輸出 h1，內文從 `##` 開始。
- 截圖必須是真實產品畫面，不放示意圖或 placeholder。
- 圖表用 ` ```mermaid ` 區塊，在瀏覽器端算繪並跟著主題重畫。

**提示框要寫成獨立的段落，不要擠在同一行：**

```markdown
:::warning[標題]

內容。

:::
```

Prettier 的 `proseWrap: "never"` 會把同一段的多行併成一行。標題和內文寫在一起的話，格式化之後標題會被黏進內文，而且沒有辦法自動還原。

## AI 可讀的輸出

由 `src/pages/` 底下的端點在建置時產生：

| 檔案            | 內容                                   |
| --------------- | -------------------------------------- |
| `llms.txt`      | 全站索引，層級是「產品 → 區塊 → 頁面」 |
| `llms-full.txt` | 全站內容串成一個檔案                   |
| `<route>.md`    | 每一頁的 Markdown 原文                 |

順序跟著 `src/lib/products.ts` 走，所以索引的結構和讀者看到的側欄一致。每一頁的「複製 Markdown」與「在 ChatGPT／Claude 開啟」拿的都是這份 `.md`，不是渲染後的 HTML。

## 部署

`main` 推上去就由 `.github/workflows/deploy.yml` 建置並部署到 GitHub Pages。

自訂網域在 **Settings → Pages → Custom domain** 設定，**不需要**在 `public/` 放 `CNAME`——用 GitHub Actions 部署時，網域設定存在 repository 的 Pages 設定裡，不是從產物讀出來的。

:::warning[記得打開 Enforce HTTPS]

`configure-pages` 回報的 `origin` 會跟著這個設定變動，而那個值會寫進 `llms.txt` 與各頁 Markdown 的**絕對連結**。沒打開的話，AI 工具拿到的會是一整份 `http://` 連結。

:::

## Commit And PR Guidance

Use Linux kernel/Git-style commit subjects with a concrete area, subsystem, component, directory, package, or file prefix:

```
area: imperative patch summary
sub/sys: imperative patch summary
```

The prefix should name the repository area primarily changed — a product (`huan`, `ui`), a directory, or a component. Do not use generic Conventional Commit prefixes such as `fix:`, `feat:`, `chore:`, `docs:`, or `refactor:` unless they are actual repository areas here.

Use an imperative verb after the colon. Prefer subjects under 72 characters. Use lowercase for the first word unless it is a proper noun, and do not end the subject with a period.

Examples:

```
huan/guide: document the unbind flow
ui/tokens: correct the contrast table
lib/products: match a product on its landing page
search: exclude page chrome from the index
```

Use a commit body when the reason for the change is not obvious from the diff. Explain why the change is needed, not just what changed.

If no validation was run, state that explicitly and explain why. Do not claim to have run commands that were not actually executed.
