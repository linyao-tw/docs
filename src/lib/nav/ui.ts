import type { NavNode, Section } from "@/lib/products";

const UI: NavNode[] = [
	{
		label: "開始",
		items: [
			{ label: "開始使用", id: "ui/index" },
			{ label: "設計原則", id: "ui/design-principles" }
		]
	},
	{
		label: "設計基礎",
		items: [
			{ label: "設計變數", id: "ui/tokens" },
			{ label: "主題", id: "ui/theming" }
		]
	},
	{ label: "元件", id: "ui/components" },
	{ label: "架構", id: "ui/architecture" }
];

/** 設計系統只有一個區塊，因此不會出現區塊切換器，側欄直接就是選單。 */
export const UI_SECTIONS: Section[] = [{ label: "設計系統", entry: "ui/index", match: () => true, nav: UI }];
