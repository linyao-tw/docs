import type { Root } from "mdast";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { visit } from "unist-util-visit";

interface Size {
	width: number;
	height: number;
}

/** PNG 的 IHDR 固定在檔頭：8 bytes 簽章 + 4 長度 + 4 型別，寬高各一個 32-bit big-endian。 */
function pngSize(file: string): Size | null {
	let head: Buffer;
	try {
		head = readFileSync(file).subarray(0, 24);
	} catch {
		return null;
	}
	if (head.length < 24 || head.readUInt32BE(0) !== 0x89504e47) return null;
	return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

const IMG = /<img\s+([^>]*?)\s*\/?>/g;
const SRC = /\bsrc\s*=\s*"([^"]+)"/;

/**
 * 處理文件裡的截圖：補上 width / height、換上符合主題的那一張，並讓它可以點開看原圖。
 *
 * 沒有這兩個屬性，瀏覽器要等圖片下載完才知道要留多高，在此之前底下的文字會
 * 先往上擠、再被推下去 —— 讀者滑到一半整段跳走。有了尺寸，版面在圖片還沒到
 * 之前就已經是對的。順便補上 lazy / async，截圖都在首屏以下。
 *
 * 尺寸直接從 public/ 底下的檔案讀，不寫在 Markdown 裡：換一張截圖就自動更新，
 * 不會留下一組跟圖片對不上的數字。
 *
 * 同一個資料夾裡有 `foo-dark.png` 時就連深色版一起輸出，由 CSS 依主題決定顯示
 * 哪一張。Markdown 只要寫亮色那一張，作者不必記得成對維護；沒有深色版的圖
 * （例如流程圖）則維持原樣，走既有的壓暗處理。
 *
 * 不用 `<picture>` 加 `prefers-color-scheme`：站上的主題是手動切換的，媒體查詢
 * 只看得到作業系統設定，切了主題圖片不會跟著換。
 *
 * 這是 remark 而不是 rehype 外掛：截圖是寫在 Markdown 裡的原始 HTML，
 * 會以 `html` 節點原封不動送到輸出，根本不會變成 hast 的 element。
 */
export function remarkFigures(publicDir = "public") {
	const cache = new Map<string, Size | null>();

	const sizeOf = (src: string): Size | null => {
		let size = cache.get(src);
		if (size === undefined) {
			size = pngSize(join(publicDir, src));
			cache.set(src, size);
		}
		return size;
	};

	const darkTwin = (src: string): string | null => {
		const dark = src.replace(/\.png$/, "-dark.png");
		if (dark === src) return null;
		return sizeOf(dark) ? dark : null;
	};

	return (tree: Root): void => {
		visit(tree, ["html", "inlineCode"], node => {
			if (node.type !== "html") return;
			const inFigure = node.value.includes("huan-figure");
			node.value = node.value.replace(IMG, (tag, attributes: string) => {
				if (/\b(width|height)\s*=/.test(attributes)) return tag;
				const src = SRC.exec(attributes)?.[1];
				if (src === undefined || !src.startsWith("/")) return tag;
				const size = sizeOf(src);
				if (!size) return tag;
				const extra = [`width="${size.width}"`, `height="${size.height}"`];
				if (!/\bloading\s*=/.test(attributes)) extra.push('loading="lazy"');
				if (!/\bdecoding\s*=/.test(attributes)) extra.push('decoding="async"');
				const dark = darkTwin(src);
				const img =
					dark === null
						? `<img ${attributes} ${extra.join(" ")} />`
						: `<img ${attributes} ${extra.join(" ")} data-theme-variant="light" /><img ${attributes.replace(SRC, `src="${dark}"`)} ${extra.join(" ")} data-theme-variant="dark" />`;
				// 1280×720 的截圖縮到手機的 343px 之後是看不清楚的，包一層連結讓它可以點開放大。
				return inFigure ? `<a class="huan-figure__zoom" href="${src}">${img}</a>` : img;
			});
		});
	};
}
