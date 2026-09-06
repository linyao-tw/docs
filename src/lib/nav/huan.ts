import type { NavNode, Section } from "@/lib/products";

/** 使用教學：寫給實際操作 HUAN 的人。不談程式碼、指令或部署。 */
const GUIDE: NavNode[] = [
	{
		label: "開始使用",
		items: [
			{ label: "快速開始", id: "huan/index" },
			{ label: "核心概念", id: "huan/guide/concepts" }
		]
	},
	{
		label: "日常操作",
		items: [
			{ label: "上傳素材", id: "huan/guide/media" },
			{ label: "設計版面", id: "huan/guide/layouts" },
			{ label: "安排播放時段", id: "huan/guide/schedules" },
			{ label: "管理裝置", id: "huan/guide/devices" }
		]
	},
	{
		label: "播放裝置",
		items: [
			{ label: "配對裝置", id: "huan/guide/pairing" },
			{ label: "離線播放", id: "huan/guide/offline" },
			{ label: "解除綁定", id: "huan/guide/unbind" },
			{ label: "在 Raspberry Pi 上安裝", id: "huan/guide/install-raspberry-pi" },
			{ label: "在 Ubuntu 上安裝", id: "huan/guide/install-ubuntu" },
			{ label: "在 Windows 上安裝", id: "huan/guide/install-windows" },
			{ label: "在 macOS 上安裝", id: "huan/guide/install-macos" }
		]
	},
	{
		label: "帳號",
		items: [
			{ label: "登入", id: "huan/guide/account" },
			{ label: "兩步驟驗證", id: "huan/guide/two-factor" },
			{ label: "使用者與權限", id: "huan/guide/users" }
		]
	},
	{ label: "疑難排解", id: "huan/guide/troubleshooting" }
];

/** 開發者：寫給要架設、修改或部署 HUAN 的人。 */
const DEV: NavNode[] = [
	{
		label: "開發環境",
		items: [
			{ label: "開始開發", id: "huan/dev/index" },
			{ label: "Monorepo", id: "huan/dev/monorepo" },
			{ label: "指令", id: "huan/dev/commands" },
			{ label: "測試", id: "huan/dev/testing" }
		]
	},
	{
		label: "架構",
		items: [
			{ label: "系統架構", id: "huan/dev/architecture" },
			{ label: "Server", id: "huan/dev/server" },
			{ label: "Worker", id: "huan/dev/worker" },
			{ label: "Device", id: "huan/dev/device" },
			{ label: "素材生命週期", id: "huan/dev/asset-lifecycle" },
			{ label: "Desired / Reported State", id: "huan/dev/desired-reported-state" },
			{ label: "版面與縮放", id: "huan/dev/layout-engine" },
			{ label: "排程與時區", id: "huan/dev/scheduling" },
			{ label: "協定", id: "huan/dev/protocol" }
		]
	},
	{
		label: "部署",
		items: [
			{ label: "Docker", id: "huan/dev/deploy/docker" },
			{ label: "環境變數", id: "huan/dev/deploy/environment" },
			{ label: "PostgreSQL", id: "huan/dev/deploy/postgresql" },
			{ label: "RustFS", id: "huan/dev/deploy/rustfs" },
			{ label: "GitHub Pages", id: "huan/dev/deploy/github-pages" },
			{ label: "發布", id: "huan/dev/release" }
		]
	},
	{
		label: "架構決策紀錄",
		collapsed: true,
		items: [
			{ label: "總覽", id: "huan/dev/adr/index" },
			{ label: "0001 WebSocket 加 REST", id: "huan/dev/adr/0001-websocket-plus-rest" },
			{ label: "0002 Desired / Reported State", id: "huan/dev/adr/0002-desired-reported-state" },
			{ label: "0003 物件儲存只做暫存", id: "huan/dev/adr/0003-temporary-object-storage" },
			{ label: "0004 遞迴分割版面", id: "huan/dev/adr/0004-recursive-split-layout" },
			{ label: "0005 本機優先播放", id: "huan/dev/adr/0005-local-first-playback" },
			{ label: "0006 選擇 Electron", id: "huan/dev/adr/0006-electron" },
			{ label: "0007 PostgreSQL 工作佇列", id: "huan/dev/adr/0007-postgres-job-queue" }
		]
	},
	{ label: "疑難排解", id: "huan/dev/troubleshooting" }
];

export const HUAN_SECTIONS: Section[] = [
	{ label: "使用教學", entry: "huan/index", match: id => !isDev(id), nav: GUIDE },
	{ label: "開發者", entry: "huan/dev/index", match: isDev, nav: DEV }
];

/*
 * `huan/dev` 也算開發者區塊，不是只有 `huan/dev/`。
 *
 * Astro 的 glob loader 會把 `huan/dev/index.md` 的 id 砍成 `huan/dev`，
 * 只比對 `startsWith("huan/dev/")` 的話，開發者區塊的首頁會被判成使用教學。
 */
function isDev(id: string): boolean {
	return id === "huan/dev" || id.startsWith("huan/dev/");
}
