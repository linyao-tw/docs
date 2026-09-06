---
title: "元件"
description: "元件清單、共用 API、在地化與組合方式。"
---

本文件列出 Linyao Design System 的元件分類、共用 API 與組合邊界。實際可匯入項目以 `packages/ui/src/index.ts` 與建置產生的 `dist/index.d.ts` 為準。未列入公開匯出入口的原始檔不屬於公開 API。

## 共用 API

| 概念       | API                                                            | 規則                                        |
| ---------- | -------------------------------------------------------------- | ------------------------------------------- |
| 視覺／語意 | `variant`                                                      | 不以 `intent`／`appearance` 表達相同概念    |
| 尺寸       | `size="sm"`／`size="md"`／`size="lg"`                          | 元件只支援適用的範圍                        |
| 方向       | `orientation`                                                  | 只用於有水平／垂直語意的元件                |
| 狀態       | `disabled`, `readOnly`, `required`, `invalid`, `loading`       | 映射至原生、Base UI 或 RAC 語意             |
| 值         | `value`, `defaultValue`, `onValueChange`                       | 受控／非受控，不混用兩種狀態所有權          |
| 開啟狀態   | `open`, `defaultOpen`, `onOpenChange`                          | 彈出／展開元件的受控／非受控狀態            |
| 表單語意   | `name`, `min`, `max`, `step`                                   | 底層基礎元件支援時傳遞                      |
| 地區設定   | `locale`, `hourCycle`, `firstDayOfWeek`, structured value type | 只用於相關元件；時區由 `ZonedDateTime` 表示 |
| 組合       | `children`, parts, `render`                                    | 優先組合，不分支修改原始碼                  |
| 版面       | `className`, `style`                                           | 用於位置／尺寸；顏色使用設計變數            |

受控：

```tsx
const [value, setValue] = React.useState("line-a");

<SegmentedControl value={value} onValueChange={next => next && setValue(next)} aria-label="生產線">
	<SegmentedControlItem value="line-a">生產線 A</SegmentedControlItem>
	<SegmentedControlItem value="line-b">生產線 B</SegmentedControlItem>
</SegmentedControl>;
```

非受控：

```tsx
<Select
	defaultValue="normal"
	options={[
		{ value: "normal", label: "一般" },
		{ value: "priority", label: "優先" }
	]}
	aria-label="派送模式"
/>
```

不得同時傳入 `value` 與 `defaultValue`。使用者控制值或開啟狀態時，也必須在回呼中更新狀態。Linyao Design System 不建立另一份業務狀態。

## 元件清單

### 基礎元件

- `Button`：`primary`、`secondary`、`neutral`、`quiet`、`danger`；尺寸、載入、起始／結尾圖示。`neutral` 在亮色與深色主題均使用高對比灰色表面；破壞性操作使用 `danger`，不得以一般灰色按鈕代替。
- `IconButton`：只有圖示的操作，必須有可存取名稱。
- `Link`：保留連結與導覽語意。
- `Badge`、`Avatar`、`Separator`。
- `Card` 與 `CloudBox` 別名：material／elevated／inset／outline／cloud 表面。
- `SectionHeading`。
- `ListCell`：前置內容、主要內容、標題、說明、metadata、後置內容。

`Button` 載入時會停用操作並設定 `aria-busy`。`IconButton` 的可見圖示屬於裝飾，可存取名稱必須由 `aria-label` 或 `aria-labelledby` 提供。

```tsx
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/csr/FloppyDisk";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { Button, IconButton } from "@linyao.tw/ui";

<Button startIcon={<FloppyDiskIcon weight="bold" />}>儲存變更</Button>;
<Button endIcon={<ArrowRightIcon weight="bold" />}>繼續</Button>;
<IconButton aria-label="新增項目">
	<PlusIcon weight="bold" />
</IconButton>;
```

`startIcon`／`endIcon` 是裝飾性的 `ReactNode` 插槽，尺寸與顏色由 Button 控制。載入時 spinner 取代起始圖示並隱藏結尾圖示，但可見標籤仍作為可存取名稱。只有圖示的操作應使用 `IconButton`。用戶端程式碼使用 Phosphor 個別 CSR 匯入；不得手寫 SVG 或以 Unicode 字元代替圖示。

### 表單輸入

- `Input`。
- `TextField`、`Textarea`／`TextView`。
- `SearchField`、`PasswordField`、`NumberField`。
- `CodeField`、`PhoneField`、`OTPField`。
- `FileUpload`、`DropZone`。

欄位元件共用標籤、說明、錯誤、必填／無效／停用／唯讀狀態與 `sm`／`md`／`lg` 尺寸。沒有可見標籤時，實際控制項必須提供 `aria-label` 或 `aria-labelledby`。

`PhoneField` 不解析國碼或驗證電話號碼。`CodeField` 不決定驗證協定。`OTPField` 只處理多欄輸入；發送、重送、倒數與伺服器驗證由應用程式負責。

`FileUpload`／`DropZone` 只回傳瀏覽器 `File` 物件。上傳傳輸、限制、MIME／內容驗證、重試、進度來源與安全掃描由應用程式處理；`accept` 只提供瀏覽器提示。

### 選取元件

- `Checkbox`、`CheckboxGroup`、`CheckboxItem`。
- `RadioGroup`、`Radio`、`RadioItem`。
- `Switch`。
- `Slider`。
- `Toggle`、`ToggleGroup`、`SegmentedControl`／`SegmentedControlItem`。
- `Select`，提供 `options` API 與組合 parts。
- `Combobox`、`Autocomplete`，提供選項與組合 parts。
- `DropdownMenu`／`Menu`、`ContextMenu`。

`Switch` 用於立即生效的二元設定；`Checkbox` 用於表單中的獨立選項；`RadioGroup` 用於互斥選項；`SegmentedControl` 用於少量並列的檢視／模式。不得因外觀相近而交換語意。

一般選項可使用高階 `Select`／`Combobox`。需要群組、分隔線、複合項目或特殊 render 時，使用同一元件的 parts，不直接混用未樣式化基礎元件。

Base UI 1.8.0 已包含 [#5058](https://github.com/mui/base-ui/pull/5058) 的巢狀選單 portal owner 修正；Linyao Design System 不再使用 workspace patch。Storybook 保留開啟狀態的 `role="group"`、axe、方向鍵、Escape 與焦點返回回歸測試。Base UI 焦點守衛用於 portal 的 Tab 順序導引，不得刪除、設為 inert 或以 MutationObserver 改寫。

### 展開與結構

- `Accordion`。
- `Collapsible`。
- `Tabs`：Root、List、Tab、Indicator 與 Panel。Indicator 預設隱藏。

Accordion 用於多個展開區段；Collapsible 用於單一區域；Tabs 用於同一內容中切換面板。需要 URL／連結語意時，應使用導覽元件，不以 Tabs 代替路由。

### 浮層元件

- `Tooltip`、`Popover`、`PreviewCard`。
- `Dialog`／`Modal`。
- `AlertDialog`。
- `Drawer`。
- `BottomSheet`：把手、頁首／內容／頁尾與停駐點。

浮層元件保留 Base UI 的焦點限制、Escape、焦點返回、外部互動與定位。最小 Dialog：

```tsx
<Dialog.Root>
	<Dialog.Trigger render={triggerProps => <Button {...triggerProps}>開啟設定</Button>} />
	<Dialog.Portal>
		<Dialog.Backdrop />
		<Dialog.Viewport>
			<Dialog.Popup hasCustomClose>
				<Dialog.Header>
					<Dialog.Title>設定</Dialog.Title>
					<Dialog.Description>調整工作站設定。</Dialog.Description>
				</Dialog.Header>
				<Dialog.Body>{/* 欄位 */}</Dialog.Body>
				<Dialog.Footer>
					<Dialog.Close
						render={closeProps => (
							<Button {...closeProps} variant="secondary">
								完成
							</Button>
						)}
					/>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Viewport>
	</Dialog.Portal>
</Dialog.Root>
```

自行提供 `Dialog.Close` 時，在 `Dialog.Popup` 設定 `hasCustomClose`，避免重複關閉按鈕。`AlertDialog` 只用於需要明確確認的決策。Tooltip 不能承載完成任務所需的唯一資訊；需要螢幕閱讀器與觸控使用者主動探索內容時，使用 `Popover`。

### 回饋元件

- `Alert`／`AlertView`、`Banner`。
- `ToastProvider`、`ToastViewport`、`ToastRoot` 與 Toast 管理工具。
- `Progress`、`Meter`。
- `Spinner`／`Loader`。
- `Skeleton`。
- `EmptyState`。

狀態使用 `neutral`、`info`、`success`、`warning`、`danger`。狀態不能只靠顏色，必須提供可理解的標題／說明或可存取標籤。

Toast 佇列由 Base UI 管理器處理。使用者決定加入佇列、去重複、重試與後端錯誤文案。需要長期保留或會影響任務完成的訊息，不應只使用短暫 Toast。

`Progress` 表示任務進度；`Meter` 表示已知範圍中的測量值。無確定進度的載入使用 `Spinner`／`Loader`，並由周圍區域提供適當的忙碌狀態關聯。

### 導覽

- `Breadcrumb`、`Pagination`。
- `NavigationMenu`、`Menubar`、`Toolbar`。
- `Header` 組合 parts。
- `TabBar`。
- `CommandPalette`。

路由由應用程式管理。連結目的地、目前路由、預先載入與導覽副作用都由使用者提供；接上路由連結時仍須保留錨點語意、可存取名稱與鍵盤行為。

Pagination 只呈現控制項與狀態，不取得資料或決定頁碼模型。CommandPalette 只提供 Dialog 與 Combobox 組合，不建立指令登錄、快捷鍵規則、權限或非同步搜尋後端。

### 資料與內容

- 使用原生語意的 `Table`、`TableFrame`。
- `DataTable`：頁首／標題／說明／控制項／狀態／區域。
- `ScrollArea`。
- `List`、`OrderedList`、`Collection` 與項目／內容／操作／metadata parts。

`DataTable` 不包含排序演算法、篩選狀態、伺服器分頁、列選取業務規則、資料取得或欄位 schema 引擎。

`Collection` 不處理大量資料虛擬化。大型清單的視窗化、尺寸測量與非同步載入由應用程式選擇方案，再套用 Linyao Design System 語意與設計變數。

### 日期與時間

- `Calendar`：月份／年份導覽、鍵盤日曆格線、最小／最大值與不可用日期。
- `DateField`。
- `DatePicker`。
- `DateRangePicker`。
- `TimeField`、`TimePicker`。
- `DateTimePicker`。

Linyao Design System 從套件根目錄重新匯出常用值類別與剖析器：

```tsx
import { useState } from "react";
import { CalendarDate, DateRangePicker } from "@linyao.tw/ui";

const [range, setRange] = useState({
	start: new CalendarDate(2026, 9, 1),
	end: new CalendarDate(2026, 9, 5)
});

<DateRangePicker label="維護期間" locale="zh-TW" value={range} onValueChange={next => next && setRange(next)} minValue={new CalendarDate(2026, 9, 1)} isDateUnavailable={date => date.day === 13} />;
```

值型別：

- `CalendarDate`：不含時間／時區的日期，例如生日或結算日。
- `CalendarDateTime`：不含指定時區的當地日期與時間。
- `ZonedDateTime`：包含 IANA 時區與確切時間點。
- `Time`：不含日期的當地時間。

`locale` 控制語言與區段；`hourCycle`、`granularity`、`firstDayOfWeek`、`minValue`、`maxValue` 與 `isDateUnavailable` 由使用者指定。不得將 `zh-TW`、`Asia/Taipei`、`YYYY/MM/DD` 或 24 小時制設為套件預設值。

Linyao Design System 不自動將 `CalendarDateTime` 轉為 `ZonedDateTime`。需要確切時間點時，應用程式必須提供時區、處理 DST／不存在／重複的當地時間，並決定序列化方式。

## 不屬於元件層的功能

下列功能由應用程式處理：

- DataTable 排序／篩選／資料取得／虛擬化；
- 上傳傳輸或雲端供應商轉接器；
- 國際電話解析／國家資料庫；
- 指令登錄、全域鍵盤快捷鍵管理器或路由整合；
- 表單套件專用轉接器；
- 分析、持久化、權限、API 用戶端；
- 產品特定的日期格式、假日日曆、預約限制或時區轉換規則。

只有跨產品、沒有業務假設且可維持可存取性的需求，才評估新增 headless 轉接器或組合模式。

## 新增元件的判斷

1. 現有 `variant`、`size` 或語意變數是否已支援？
2. 是否可用現有 parts 組合？
3. 差異是否只屬於使用者版面，可用 `className` 解決？
4. 是否為應用程式業務邏輯？
5. 只有共用、可重複且可存取的行為才新增元件。

分支修改會失去後續修正、設計變數、鍵盤行為與測試。確定需要新元件時，依[貢獻指南](https://github.com/linyao-tw/ui/blob/main/CONTRIBUTING.md)完成 API、狀態、Storybook stories、測試、可存取性與套件匯出。

## 在地化

元件的預設字串（關閉、上一頁、清除選取、已選擇 N 個檔案等）集中在訊息套件，不再散落於各元件的預設參數。沒有 provider 時使用繁體中文套件，行為與過去一致：

```tsx
import { MessagesProvider, enUSMessages } from "@linyao.tw/ui";

<MessagesProvider messages={enUSMessages}>
	<App />
</MessagesProvider>;
```

部分覆寫會與外層套件合併，因此只調整單一字串不需要重寫整份：

```tsx
<MessagesProvider messages={{ dialogClose: "收合面板" }}>
	<SettingsDialog />
</MessagesProvider>
```

優先順序是「元件屬性 → 最近的 provider → 繼承的 provider → 繁體中文預設」。`ComponentMessages` 是完整的字串清單；`codeSlotLabel` 與 `fileSelectionSummary` 是函式，用於需要插入數字的字串。

### 一次設定兩邊：`LinyaoProvider`

字串套件與日期時間的地區設定是兩套獨立機制：前者是 `MessagesProvider`，後者是 React Aria 的 `I18nProvider`。分別設定很容易漂移，出現「按鈕是英文、日期格式是 zh-TW」這種組合。`LinyaoProvider` 從單一 `locale` 同時決定兩者：

```tsx
import { LinyaoProvider } from "@linyao.tw/ui";

<LinyaoProvider locale="en-US">
	<App />
</LinyaoProvider>;
```

`locale` 會挑選內建套件（`zh` 開頭用繁體中文，其餘用英文），同時提供給日期時間元件決定區段順序、星期名稱、數字格式與預設小時制。需要套件未內建的語言，或只想改幾個字串時，`messages` 會合併在挑選出的套件之上：

```tsx
<LinyaoProvider locale="ja-JP" messages={{ dialogClose: "閉じる" }}>
	<App />
</LinyaoProvider>
```

`getMessagesForLocale(locale)` 會回傳某個地區代碼對應的內建套件，可用於自行組合。省略 `locale` 時行為與單獨使用 `MessagesProvider` 相同：保持繁體中文預設，也不建立 `I18nProvider`。

個別日期時間元件的 `locale` 屬性仍然有效，會覆寫 provider 提供的值。

### 書寫方向

書寫方向不由 provider 控制。`dir` 屬於文件層級，和 `data-lyds-theme` 一樣必須在伺服器輸出的標記裡就正確，否則第一次繪製會閃動：

```html
<html lang="ar" dir="rtl" data-lyds-theme="light"></html>
```

元件 CSS 全面使用 logical properties，設定 `dir` 後間距、圓角與圖示位置會自動跟著鏡射。

## 組合方式

`Dialog`、`Drawer`、`Tabs`、`Accordion`、`Popover`、`Menu`、`Select`、`Combobox` 與 `CommandPalette` 都同時提供 namespace 與扁平匯出，建議使用 namespace：

```tsx
<CommandPalette.Root>
	<CommandPalette.Trigger>開啟指令列</CommandPalette.Trigger>
	<CommandPalette.Portal>
		<CommandPalette.Backdrop />
		<CommandPalette.Popup>
			<CommandPalette.Input />
			<CommandPalette.List>{/* … */}</CommandPalette.List>
		</CommandPalette.Popup>
	</CommandPalette.Portal>
</CommandPalette.Root>
```

`CommandPalette` 本身也是 root 元件，因此 `<CommandPalette>` 與 `<CommandPalette.Root>` 之外的 parts 都掛在同一個匯出上。完整規則見[架構文件的組合模型](/ui/architecture#組合模型)。
