/**
 * 換頁時的載入指示。
 *
 * 客戶端導覽要等新頁面抓回來才換，在那之前畫面完全沒有反應 —— 點下去像是
 * 沒點到，於是有人會再點一次。這條進度列補上那段空白。
 *
 * 進度是假的，因為瀏覽器並不會回報「頁面載入了幾成」。它的工作不是報告進度，
 * 而是告訴使用者「收到了，正在做」，所以往前爬得越來越慢，永遠不會自己走到底，
 * 真的載完才收尾。
 */

/** 太快的導覽不要閃一下，本機或有快取時常常 50ms 就結束了。 */
const SHOW_AFTER = 120;

/** 爬到這裡就停住等真正的完成，不要讓它假裝已經好了。 */
const CREEP_CEILING = 0.9;

let bar: HTMLElement | undefined;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let creepTimer: ReturnType<typeof setInterval> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let progress = 0;

function element(): HTMLElement {
	if (bar) return bar;
	const created = document.createElement("div");
	created.className = "nav-progress";
	created.setAttribute("role", "progressbar");
	created.setAttribute("aria-label", "頁面載入中");
	created.setAttribute("aria-hidden", "true");
	/*
	 * 掛在 <html> 而不是 <body>：客戶端導覽換掉的是 body，掛在裡面的話
	 * 進度列會在換頁的瞬間連同舊頁面一起被移除，而那正是它該出現的時候。
	 */
	document.documentElement.appendChild(created);
	bar = created;
	return created;
}

function paint(value: number): void {
	element().style.setProperty("--nav-progress", String(value));
}

function clearTimers(): void {
	if (showTimer) clearTimeout(showTimer);
	if (creepTimer) clearInterval(creepTimer);
	if (hideTimer) clearTimeout(hideTimer);
	showTimer = undefined;
	creepTimer = undefined;
	hideTimer = undefined;
}

function start(): void {
	clearTimers();
	progress = 0;
	paint(0);

	showTimer = setTimeout(() => {
		element().dataset.active = "true";
		creepTimer = setInterval(() => {
			// 越接近上限走得越慢，看起來像是還在努力，而不是卡住。
			progress += (CREEP_CEILING - progress) * 0.12;
			paint(progress);
		}, 120);
	}, SHOW_AFTER);
}

function done(): void {
	clearTimers();
	const node = element();

	// 還沒來得及顯示就結束了，那就什麼都不要出現。
	if (node.dataset.active !== "true") {
		paint(0);
		return;
	}

	paint(1);
	node.dataset.done = "true";
	hideTimer = setTimeout(() => {
		delete node.dataset.active;
		delete node.dataset.done;
		paint(0);
	}, 320);
}

/** 只能呼叫一次；這些事件掛在 document 上，不會跟著換頁被清掉。 */
export function initProgress(): void {
	document.addEventListener("astro:before-preparation", start);
	document.addEventListener("astro:page-load", done);
	// 導覽被取消或出錯時也要收掉，否則進度列會一直掛在上面。
	document.addEventListener("astro:before-swap", () => paint(CREEP_CEILING));
	window.addEventListener("pagehide", clearTimers);
}
