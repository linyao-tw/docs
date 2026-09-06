import { CommandPalette } from "@linyao.tw/ui";
import { navigate } from "astro:transitions/client";
import { useEffect, useRef, useState } from "react";

interface PagefindHit {
	id: string;
	data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }>;
}

interface Pagefind {
	search: (query: string) => Promise<{ results: PagefindHit[] }>;
	init?: () => Promise<void>;
}

interface Result {
	url: string;
	title: string;
	excerpt: string;
	product: string;
}

const PRODUCT_NAMES: Record<string, string> = {
	huan: "HUAN 讙",
	ui: "Linyao Design System"
};

/**
 * Pagefind 的索引是 `astro build` 之後才產生的，`astro dev` 底下並不存在。
 * 動態載入，載不到就顯示說明，而不是讓整個島炸掉。
 */
async function loadPagefind(): Promise<Pagefind | null> {
	try {
		const module = (await import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`)) as Pagefind;
		await module.init?.();
		return module;
	} catch {
		return null;
	}
}

function productOf(url: string): string {
	const head = url.replace(/^\//, "").split("/")[0] ?? "";
	return PRODUCT_NAMES[head] ?? "文件";
}

export function DocsSearch() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Result[]>([]);
	const [ready, setReady] = useState<boolean | null>(null);
	const pagefind = useRef<Pagefind | null>(null);

	// ⌘K / Ctrl+K。綁在 document 上，因為觸發鍵在任何地方按都要有效。
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent): void => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen(previous => !previous);
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	// 索引不小，等使用者真的要搜尋時才載入。
	useEffect(() => {
		if (!open || pagefind.current) return;
		void loadPagefind().then(module => {
			pagefind.current = module;
			setReady(module !== null);
		});
	}, [open]);

	useEffect(() => {
		const term = query.trim();
		if (!pagefind.current || term === "") {
			setResults([]);
			return;
		}
		// 每一次輸入都會重跑，用旗標讓晚回來的舊查詢不要蓋掉新結果。
		let current = true;
		const timer = setTimeout(async () => {
			const found = await pagefind.current?.search(term);
			const top = await Promise.all((found?.results ?? []).slice(0, 8).map(hit => hit.data()));
			if (!current) return;
			setResults(
				top.map(item => {
					const url = item.url.replace(/\.html$/, "");
					return { url, title: item.meta.title ?? url, excerpt: item.excerpt, product: productOf(url) };
				})
			);
		}, 150);
		return () => {
			current = false;
			clearTimeout(timer);
		};
	}, [query]);

	const choose = (url: string): void => {
		setOpen(false);
		setQuery("");
		void navigate(url);
	};

	return (
		<CommandPalette
			items={results}
			open={open}
			onOpenChange={next => {
				setOpen(next);
				if (!next) setQuery("");
			}}
		>
			<CommandPalette.Trigger className="search-trigger" aria-label="搜尋文件">
				<svg aria-hidden="true" viewBox="0 0 256 256" width="16" height="16" fill="currentColor">
					<path d="M229.66 218.34l-50.07-50.06a88.11 88.11 0 10-11.31 11.31l50.06 50.07a8 8 0 0011.32-11.32zM40 112a72 72 0 1172 72 72.08 72.08 0 01-72-72z"></path>
				</svg>
				<span className="search-trigger__label">搜尋文件</span>
				<kbd className="search-trigger__key">⌘K</kbd>
			</CommandPalette.Trigger>

			<CommandPalette.Portal>
				<CommandPalette.Backdrop className="search-backdrop" />
				<CommandPalette.Popup className="search-popup">
					<CommandPalette.Input className="search-input" placeholder="搜尋全部產品的文件" value={query} onChange={event => setQuery(event.target.value)} />

					<CommandPalette.List className="search-list">
						{results.map(result => (
							<CommandPalette.Item className="search-result" key={result.url} value={result} onClick={() => choose(result.url)}>
								<span className="search-result__head">
									<span className="search-result__title">{result.title}</span>
									<span className="search-result__product">{result.product}</span>
								</span>
								{/* excerpt 是 Pagefind 產生的，裡面帶 <mark> 標記命中的字。 */}
								<span className="search-result__excerpt" dangerouslySetInnerHTML={{ __html: result.excerpt }} />
							</CommandPalette.Item>
						))}
					</CommandPalette.List>

					{ready === false ? <p className="search-note">搜尋索引只在正式建置後產生，開發模式下不可用。</p> : null}
					{ready !== false && query.trim() !== "" && results.length === 0 ? <p className="search-note">找不到符合的結果。</p> : null}
				</CommandPalette.Popup>
			</CommandPalette.Portal>
		</CommandPalette>
	);
}
