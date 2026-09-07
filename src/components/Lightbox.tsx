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

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * 截圖的放大檢視。
 *
 * 用事件代理接住整份文件裡的 `.huan-figure__zoom`，而不是每張圖各自掛一個
 * 元件：圖片是 Markdown 裡的靜態 HTML，本來就不經過 React。原本的 <a> 保留著，
 * 沒有 JS、中鍵開新分頁、右鍵另存都還是原本的行為，這裡只攔截左鍵。
 *
 * 外框用設計系統的 Dialog：焦點鎖定、Esc 關閉、捲動鎖定與角落的關閉鈕都由它
 * 負責，縮放與平移這種它管不到的才自己寫。
 */
export function Lightbox() {
	const [source, setSource] = useState<Source | null>(null);
	const [scale, setScale] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
	const frame = useRef<HTMLDivElement>(null);

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

			const image = link.querySelector("img");
			if (!image) return;

			event.preventDefault();
			reset();
			setSource({ src: link.getAttribute("href") ?? image.src, alt: image.alt });
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
	 * 縮放要以游標為中心，不然放大之後想看的那一角早就跑出畫面外了。
	 * 位移量按新舊倍率的比例調整，游標底下的那一點就會留在原地。
	 */
	const zoomAt = useCallback((next: number, clientX?: number, clientY?: number): void => {
		const box = frame.current?.getBoundingClientRect();
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

	// 鍵盤：+ / - 縮放，0 還原。Esc 由 Dialog 負責。
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
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: React.PointerEvent): void => {
		const from = drag.current;
		if (!from) return;
		setOffset({ x: from.ox + (event.clientX - from.x), y: from.oy + (event.clientY - from.y) });
	};

	const onPointerUp = (event: React.PointerEvent): void => {
		// 拖曳超過幾 px 就算平移，不要順便把圖片縮回去。
		const from = drag.current;
		drag.current = null;
		event.currentTarget.releasePointerCapture(event.pointerId);
		if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > 4) return;
		if (scale === MIN_SCALE) zoomAt(CLICK_SCALE, event.clientX, event.clientY);
		else reset();
	};

	return (
		<Dialog.Root
			open={source !== null}
			onOpenChange={(open: boolean) => {
				if (!open) setSource(null);
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="lightbox__backdrop" />
				<Dialog.Popup className="lightbox" closeLabel="關閉放大檢視" closeProps={{ className: "lightbox__close" }}>
					<Dialog.Title className="lightbox__title">{source?.alt ?? "放大檢視"}</Dialog.Title>

					<div
						className="lightbox__frame"
						ref={frame}
						onWheel={onWheel}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						data-zoomed={scale > MIN_SCALE ? "true" : undefined}
						data-dragging={drag.current ? "true" : undefined}
					>
						{source ? <img className="lightbox__image" src={source.src} alt={source.alt} draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} /> : null}
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
