import { Select } from "@linyao.tw/ui";
import { navigate } from "astro:transitions/client";

export interface ProductOption {
	id: string;
	name: string;
	href: string;
	/** 建置時讀好的一段 SVG，見 `@/lib/mark`。 */
	mark: string;
}

interface Props {
	products: ProductOption[];
	current: string;
}

/**
 * 側欄最上面的產品切換器。
 *
 * 用 navigate() 而不是設定 location.href：站台開著 ClientRouter，前者走的是
 * 客戶端導覽，React runtime 與已經下載的搜尋索引都留著；後者會整頁重載，
 * 把切換產品這個最常見的操作變成最慢的一個。
 */
export function ProductSwitcher({ products, current }: Props) {
	const hrefById = new Map(products.map(product => [product.id, product.href]));

	return (
		<Select
			label="產品"
			value={current}
			onValueChange={value => {
				const href = value === null ? undefined : hrefById.get(value);
				if (href) void navigate(href);
			}}
			options={products.map(product => ({
				value: product.id,
				/*
				 * 標記放在名稱左邊。內容是我們自己在建置時讀進來的檔案，不是使用者輸入。
				 *
				 * `textValue` 一定要給：`label` 現在是節點不是字串，少了它，鍵盤打字
				 * 跳選項與無障礙名稱都會拿不到東西。
				 */
				label: (
					<span className="product-switcher__option">
						<span className="product-switcher__mark" dangerouslySetInnerHTML={{ __html: product.mark }} />
						{product.name}
					</span>
				),
				textValue: product.name
			}))}
		/>
	);
}
