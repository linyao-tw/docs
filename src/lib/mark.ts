import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

/**
 * 產品在切換器上的標記，讀成一段可以直接內嵌的 SVG。
 *
 * 為什麼是字串而不是元件：切換器是 React island，而圖示要嘛來自
 * `@phosphor-icons/core` 的檔案、要嘛來自 `public/logo/`，兩者都只有建置時的
 * Node 讀得到。在 Astro 這一側讀好、當成 prop 傳進去，島上就不必自己想辦法
 * 把名字對應到元件。
 *
 * 有自己標誌的產品用標誌，沒有的用 Phosphor 的圖示 —— 兩者佔同一個方框，
 * 清單的名稱才會對齊。
 */
export function markSvg(logo: string | undefined, icon: string): string {
	const raw = logo === undefined ? phosphor(icon) : readFileSync(resolve("public", logo.replace(/^\//, "")), "utf8");

	return (
		raw
			.replace(/<\?xml[^>]*\?>/, "")
			.replace(/<!--[\s\S]*?-->/g, "")
			.replace(/\swidth="[^"]*"/, "")
			.replace(/\sheight="[^"]*"/, "")
			/*
			 * SVG 裡的 <style> 作用範圍是整份文件。
			 *
			 * 標誌那個檔案在當 favicon 的時候需要 `path { fill: … }` 來跟著系統主題
			 * 換色，但同一段內嵌進頁面之後，會把頁面上每一個 <path> 都染成那個顏色。
			 * 內嵌版本一律拿掉，顏色交給 currentColor。
			 */
			.replace(/<style[\s\S]*?<\/style>/g, "")
			.replace(/<svg /, '<svg fill="currentColor" aria-hidden="true" focusable="false" ')
			.trim()
	);
}

function phosphor(name: string): string {
	const require = createRequire(import.meta.url);
	return readFileSync(require.resolve(`@phosphor-icons/core/assets/regular/${name}.svg`), "utf8");
}
