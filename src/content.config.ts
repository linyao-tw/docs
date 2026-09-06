import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

/**
 * 一個集合裝所有產品的文件，id 的第一段就是產品：`huan/guide/media`、`ui/tokens`。
 *
 * 不為每個產品各開一個集合，是因為搜尋索引、llms.txt 與上一頁／下一頁都要走過
 * 全站；分開之後每加一個產品就要在四個地方各補一次，遲早會漏。
 */
const docs = defineCollection({
	loader: glob({ base: "./src/content/docs", pattern: "**/*.md" }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional()
	})
});

export const collections = { docs };
