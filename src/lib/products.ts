import { HUAN_SECTIONS } from "@/lib/nav/huan";
import { UI_SECTIONS } from "@/lib/nav/ui";

export interface NavLink {
	label: string;
	/** 集合中的 id，不含副檔名。每個產品的入口是 `<product>/index`。 */
	id: string;
}

export interface NavGroup {
	label: string;
	items: NavLink[];
	/** 預設收合。只有 ADR 這種參考資料需要，一般章節保持展開。 */
	collapsed?: boolean;
}

export type NavNode = NavLink | NavGroup;

export function isGroup(node: NavNode): node is NavGroup {
	return "items" in node;
}

export interface Section {
	/** 區塊切換器上的名稱。 */
	label: string;
	/** 這個區塊的入口頁。 */
	entry: string;
	/** 判斷某一頁屬於這個產品的哪個區塊。 */
	match: (id: string) => boolean;
	nav: NavNode[];
}

export interface Product {
	/** 網址的第一段，也是內容目錄的名稱：`src/content/docs/<id>/**`。 */
	id: string;
	name: string;
	/** 一句話說明，用在產品切換器與首頁的清單。 */
	tagline: string;
	/** @phosphor-icons/core 的圖示名稱。沒有自己的標誌時用它。 */
	icon: string;
	/** 產品自己的標誌，public/ 底下的路徑。有的話在切換器上取代 `icon`。 */
	logo?: string;
	/**
	 * 產品內的區塊。只有一個時不顯示區塊切換器，側欄直接就是選單。
	 * HUAN 有兩個（使用教學／開發者），設計系統只有一個。
	 */
	sections: Section[];
}

/**
 * 產品清單。
 *
 * 要新增一個產品只有三件事：把內容放進 `src/content/docs/<id>/`、
 * 加一個 `src/lib/nav/<id>.ts` 描述側欄、然後在這裡多一筆。
 * 順序就是產品切換器與首頁的顯示順序。
 */
export const PRODUCTS: Product[] = [
	{
		id: "huan",
		name: "HUAN 讙",
		tagline: "雲端媒體播放與數位看板系統",
		icon: "monitor-play",
		logo: "/logo/huan.svg",
		sections: HUAN_SECTIONS
	},
	{
		id: "ui",
		name: "Linyao Design System",
		tagline: "麟曜的 React 元件與設計規範",
		icon: "shapes",
		sections: UI_SECTIONS
	}
];

/**
 * 集合 id → 產品。
 *
 * id 的第一段就是產品，`huan/guide/media` 與 `huan`（也就是 `huan/index`
 * 被 glob loader 砍掉尾巴之後的樣子）都屬於 huan。
 */
export function productFor(id: string): Product | undefined {
	const head = id.split("/")[0];
	return PRODUCTS.find(product => product.id === head);
}

export function sectionFor(id: string): Section | undefined {
	const product = productFor(id);
	if (!product) return undefined;
	return product.sections.find(section => section.match(id)) ?? product.sections[0];
}

/**
 * 同一頁在兩處會有兩種寫法：導覽表寫的是 `huan/index`，而集合給的是 `huan`。
 *
 * Astro 的 glob loader 會把 `index` 從 id 尾端砍掉，兩邊直接比字串永遠不會相等，
 * 結果就是產品首頁在側欄上永遠不會被標成目前頁面。統一成導覽表的寫法再比。
 */
function normalise(id: string): string {
	return id.endsWith("/index") ? id : `${id}/index`;
}

/** 兩個 id 是否指向同一頁，容許 `huan` 與 `huan/index` 這種寫法差異。 */
export function isSamePage(a: string, b: string): boolean {
	return a === b || normalise(a) === normalise(b);
}

/** 集合 id → 網址。`huan/index` 是 `/huan`，`huan/guide/media` 是 `/huan/guide/media`。 */
export function hrefFor(id: string): string {
	return `/${id.replace(/\/index$/, "")}`;
}

export function flatten(nav: NavNode[]): NavLink[] {
	return nav.flatMap(node => (isGroup(node) ? node.items : [node]));
}

/**
 * 同一個區塊內的上一頁與下一頁。
 *
 * 不跨區塊、也不跨產品串接：使用教學的讀者不會想在最後一頁被送進 ADR，
 * 更不會想被送進另一個產品的文件。
 */
export function neighbours(id: string): { previous?: NavLink; next?: NavLink } {
	const section = sectionFor(id);
	if (!section) return {};
	const order = flatten(section.nav);
	const index = order.findIndex(item => isSamePage(item.id, id));
	if (index === -1) return {};
	return { previous: order[index - 1], next: order[index + 1] };
}
