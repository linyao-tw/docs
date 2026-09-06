import { markdownUrl } from "@/lib/markdown";
import { PRODUCTS } from "@/lib/products";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

/**
 * llms.txt：整站的結構化索引。
 *
 * 連結指向每頁的 `.md` 而不是 HTML，而且是絕對網址——AI 工具通常是拿到單一
 * 檔案就直接抓連結，相對路徑在那個情境下解析不出來。
 *
 * 多產品站台的層級是「產品 → 區塊 → 頁面」，和側欄看到的一樣。
 */
export const GET: APIRoute = async ({ site }) => {
	const origin = site?.origin ?? "";
	const entries = await getCollection("docs");
	const byId = new Map(entries.map(entry => [entry.id, entry]));

	const lines = ["# 麟曜數位工作室文件", "", "> 麟曜數位工作室所有產品的文件。每一頁都有對應的 Markdown 版本，把網址的副檔名換成 `.md` 即可。", ""];

	for (const product of PRODUCTS) {
		lines.push(`## ${product.name}`, "", `> ${product.tagline}`, "");

		for (const section of product.sections) {
			// 只有一個區塊時再加一層標題只是噪音。
			if (product.sections.length > 1) lines.push(`### ${section.label}`, "");

			for (const node of section.nav) {
				const items = "items" in node ? node.items : [node];
				for (const item of items) {
					const entry = byId.get(item.id) ?? byId.get(item.id.replace(/\/index$/, ""));
					if (!entry) continue;
					const description = entry.data.description ? `: ${entry.data.description}` : "";
					lines.push(`- [${entry.data.title}](${origin}${markdownUrl(entry.id)})${description}`);
				}
			}
			lines.push("");
		}
	}

	return new Response(lines.join("\n"), {
		headers: { "content-type": "text/plain; charset=utf-8" }
	});
};
