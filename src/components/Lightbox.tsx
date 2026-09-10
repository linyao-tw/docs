import { Dialog, IconButton } from "@linyao.tw/ui";
import { useCallback, useEffect, useRef, useState } from "react";

interface Source {
	src: string;
	alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** 點一下圖片就放大到這個倍率，再點一下回到原樣。 */
const CLICK_SCALE = 2.5;
/** 開合的飛行時間。再長就會讓人覺得在等它演完。 */
const FLIGHT = 260;
const EASING = "cubic-bezier(0.2, 0, 0.2, 1)";

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 把 `from` 這個矩形對應到 `to` 所需要的 transform。
 *
 * transform-origin 是預設的中心，所以位移量算的是兩個矩形的中心差，
 * 縮放則是寬度比。
 */
function mapRect(from: DOMRect, to: DOMRect): string {
	const scale = to.width / from.width;
	const dx = to.left + to.width / 2 - (from.left + from.width / 2);
	const dy = to.top + to.height / 2 - (from.top + from.height / 2);
	return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

/** 開合時跟著圖片一起淡入淡出的周邊，讓整組動作看起來是一件事。 */
function chrome(): HTMLElement[] {
	return [...document.querySelectorAll<HTMLElement>(".lightbox__backdrop, .lightbox__title, .lightbox__controls, .lightbox__close")];
}

/**
 * 截圖的放大檢視。
 *
 * 用事件代理接住整份文件裡的 `.huan-figure__zoom`，而不是每張圖各自掛一個
 * 元件：圖片是 Markdown 裡的靜態 HTML，本來就不經過 React。原本的 <a> 保留著，
 * 沒有 JS、中鍵開新分頁、右鍵另存都還是原本的行為，這裡只攔截左鍵。
 *
 * 外框用設計系統的 Dialog：焦點鎖定、Esc 關閉、捲動鎖定與角落的關閉鈕都由它
 * 負責，縮放、平移與開合的飛行這種它管不到的才自己寫。
 */
export function Lightbox() {
	const [source, setSource] = useState<Source | null>(null);
	const [scale, setScale] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);

	const image = useRef<HTMLImageElement>(null);
	const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
	/** 被點開的那張縮圖在頁面上的位置，開合都要飛回這裡。 */
	const origin = useRef<DOMRect | null>(null);
	/** 圖片在對話框裡、未縮放時的位置。用它算飛行，才不會被當下的縮放影響。 */
	const fitted = useRef<DOMRect | null>(null);
	const closing = useRef(false);
	/** 這一次開啟還沒放過飛行動畫。 */
	const opening = useRef(false);

	const reset = useCallback((): void => {
		setScale(1);
		setOffset({ x: 0, y: 0 });
	}, []);

	useEffect(() => {
		const onClick = (event: MouseEvent): void => {
			// 只接管單純的左鍵；帶了輔助鍵表示使用者想要新分頁或下載。
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

			const target = event.target as Element | null;
			const link = target?.closest<HTMLAnchorElement>("a.huan-figure__zoom");
			if (!link) return;

			/*
			 * 截圖可能亮色深色各放一張，其中一張是 display:none。隱藏的那張量不到
			 * 尺寸，拿它當飛行起點的話動畫會從畫面左上角冒出來，放大後也會是不對
			 * 的主題 —— 兩件事都要跟著看得見的那一張走。
			 */
			const images = [...link.querySelectorAll("img")];
			const thumbnail = images.find(image => image.getBoundingClientRect().width > 0) ?? images[0];
			if (!thumbnail) return;

			event.preventDefault();
			origin.current = thumbnail.getBoundingClientRect();
			fitted.current = null;
			opening.current = true;
			reset();
			setSource({ src: thumbnail.getAttribute("src") ?? link.getAttribute("href") ?? thumbnail.src, alt: thumbnail.alt });
		};

		/*
		 * 必須用捕獲階段。
		 *
		 * ClientRouter 也在 document 上聽 click，而它是在 <head> 註冊的，比這個
		 * 元件掛載得早；同樣走冒泡的話它會先跑，把圖片網址當成一頁做客戶端導覽 ——
		 * 畫面就整個換成一張裸圖。搶在它前面 preventDefault，它看到就會放手。
		 */
		document.addEventListener("click", onClick, true);
		return () => document.removeEventListener("click", onClick, true);
	}, [reset]);

	/*
	 * 開場的飛行。
	 *
	 * 先量出圖片在對話框裡的最終位置，再把它瞬間搬回縮圖的位置，然後放手讓它
	 * 飛回來 —— 也就是 FLIP。直接淡入的話，使用者會失去「我點的是這一張」的線索。
	 *
	 * 用 callback ref 而不是 useEffect：Dialog 的 portal 不保證在設定 open 的那一次
	 * commit 就把內容掛上去，effect 跑的時候 ref 還是 null，飛行就靜靜地不會發生
	 * （而且因為相依沒再變，也不會補跑）。改成節點真的接上來的那一刻才動手。
	 */
	const attach = useCallback((node: HTMLImageElement | null): void => {
		image.current = node;
		if (!node || !opening.current) return;
		opening.current = false;

		const play = (): void => {
			const box = node.getBoundingClientRect();
			fitted.current = box;

			const from = origin.current;
			if (!from || from.width === 0 || box.width === 0 || prefersReducedMotion()) return;

			node.animate([{ transform: mapRect(box, from) }, { transform: "none" }], { duration: FLIGHT, easing: EASING });
			for (const part of chrome()) part.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FLIGHT, easing: EASING });
		};

		if (node.complete) play();
		else node.addEventListener("load", play, { once: true });
	}, []);

	/** 關閉時飛回縮圖的位置，等飛完才真的卸載。 */
	const requestClose = useCallback((): void => {
		if (closing.current) return;

		const node = image.current;
		const from = fitted.current;
		const to = origin.current;
		if (!node || !from || !to || to.width === 0 || prefersReducedMotion()) {
			setSource(null);
			return;
		}

		closing.current = true;
		const current = node.style.transform || "none";
		const flight = node.animate([{ transform: current }, { transform: mapRect(from, to) }], { duration: FLIGHT, easing: EASING, fill: "forwards" });
		for (const part of chrome()) part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLIGHT, easing: EASING, fill: "forwards" });

		void flight.finished
			.catch(() => undefined)
			.then(() => {
				closing.current = false;
				setSource(null);
			});
	}, []);

	/*
	 * 縮放要以游標為中心，不然放大之後想看的那一角早就跑出畫面外了。
	 * 位移量按新舊倍率的比例調整，游標底下的那一點就會留在原地。
	 */
	const zoomAt = useCallback((next: number, clientX?: number, clientY?: number): void => {
		const box = image.current?.parentElement?.getBoundingClientRect();
		setScale(previous => {
			const target = clamp(next, MIN_SCALE, MAX_SCALE);
			if (box && clientX !== undefined && clientY !== undefined) {
				const cx = clientX - box.left - box.width / 2;
				const cy = clientY - box.top - box.height / 2;
				const ratio = target / previous;
				setOffset(o => (target === MIN_SCALE ? { x: 0, y: 0 } : { x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
			} else if (target === MIN_SCALE) {
				setOffset({ x: 0, y: 0 });
			}
			return target;
		});
	}, []);

	// 鍵盤：+ / - 縮放，0 還原。Esc 由 Dialog 轉成 onOpenChange。
	useEffect(() => {
		if (!source) return;
		const onKey = (event: KeyboardEvent): void => {
			if (event.key === "+" || event.key === "=") zoomAt(scale + 0.5);
			else if (event.key === "-") zoomAt(scale - 0.5);
			else if (event.key === "0") reset();
			else return;
			event.preventDefault();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [source, scale, zoomAt, reset]);

	const onWheel = (event: React.WheelEvent): void => {
		event.preventDefault();
		zoomAt(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), event.clientX, event.clientY);
	};

	const onPointerDown = (event: React.PointerEvent): void => {
		if (scale === MIN_SCALE) return;
		drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
		setDragging(true);
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: React.PointerEvent): void => {
		const from = drag.current;
		if (!from) return;
		setOffset({ x: from.ox + (event.clientX - from.x), y: from.oy + (event.clientY - from.y) });
	};

	const onPointerUp = (event: React.PointerEvent): void => {
		const from = drag.current;
		drag.current = null;
		setDragging(false);
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

		// 拖曳超過幾 px 就算平移，不要順便把圖片縮回去或關掉。
		if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > 4) return;

		// 點在圖片外面的灰色區域，就是想離開。
		if (event.target !== image.current) {
			requestClose();
			return;
		}

		if (scale === MIN_SCALE) zoomAt(CLICK_SCALE, event.clientX, event.clientY);
		else reset();
	};

	return (
		<Dialog.Root
			open={source !== null}
			onOpenChange={(open: boolean) => {
				if (!open) requestClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="lightbox__backdrop" />
				<Dialog.Popup className="lightbox" closeLabel="關閉放大檢視" closeProps={{ className: "lightbox__close" }}>
					<Dialog.Title className="lightbox__title">{source?.alt ?? "放大檢視"}</Dialog.Title>

					<div
						className="lightbox__frame"
						onWheel={onWheel}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						data-zoomed={scale > MIN_SCALE ? "true" : undefined}
						data-dragging={dragging ? "true" : undefined}
					>
						{source ? (
							<img className="lightbox__image" ref={attach} src={source.src} alt={source.alt} draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />
						) : null}
					</div>

					<div className="lightbox__controls">
						<IconButton aria-label="縮小" variant="secondary" size="sm" disabled={scale <= MIN_SCALE} onClick={() => zoomAt(scale - 0.5)}>
							<svg viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true">
								<path d="M224 128a8 8 0 01-8 8H40a8 8 0 010-16h176a8 8 0 018 8z"></path>
							</svg>
						</IconButton>

						<button className="lightbox__level" type="button" onClick={reset} disabled={scale === MIN_SCALE}>
							{Math.round(scale * 100)}%
						</button>

						<IconButton aria-label="放大" variant="secondary" size="sm" disabled={scale >= MAX_SCALE} onClick={() => zoomAt(scale + 0.5)}>
							<svg viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true">
								<path d="M224 128a8 8 0 01-8 8h-80v80a8 8 0 01-16 0v-80H40a8 8 0 010-16h80V40a8 8 0 0116 0v80h80a8 8 0 018 8z"></path>
							</svg>
						</IconButton>
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
