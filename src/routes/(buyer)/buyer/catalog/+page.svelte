<script lang="ts">
	import { Button } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { formatCurrency, calcTaxIncluded } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Cart stored in localStorage
	interface CartItem { id: string; name: string; sku: string; price: number; tax_rate: number; unit: string; min_qty: number; qty: number }

	function readCart(): CartItem[] {
		if (typeof localStorage === 'undefined') return [];
		try {
			const raw = localStorage.getItem('limerick_cart');
			return raw ? JSON.parse(raw) : [];
		} catch { return []; }
	}

	let cart: CartItem[] = $state(readCart());

	function saveCart() {
		localStorage.setItem('limerick_cart', JSON.stringify(cart));
	}

	function addToCart(product: (typeof data.products)[0]) {
		const existing = cart.find((c) => c.id === product.id);
		if (existing) {
			existing.qty += product.min_order_qty;
		} else {
			cart = [...cart, {
				id: product.id,
				name: product.name,
				sku: product.sku,
				price: product.contract_price,
				tax_rate: product.tax_rate,
				unit: product.unit,
				min_qty: product.min_order_qty,
				qty: product.min_order_qty
			}];
		}
		saveCart();
	}

	function cartCount(id: string) {
		return cart.find((c) => c.id === id)?.qty ?? 0;
	}
</script>

<svelte:head>
	<title>{t().catalog.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().catalog.title}</h1>
		{#if cart.length > 0}
			<a href="/buyer/cart" class="cart-link">
				<Button variant="secondary">
					{t().nav.cart} ({cart.reduce((s, c) => s + c.qty, 0)})
				</Button>
			</a>
		{/if}
	</div>

	<div class="category-tabs">
		<button
			class="cat-tab"
			class:active={!data.categoryFilter}
			onclick={() => goto('/buyer/catalog')}
		>{t().common.all}</button>
		{#each data.categories as cat (cat.id)}
			<button
				class="cat-tab"
				class:active={data.categoryFilter === cat.id}
				onclick={() => goto(`/buyer/catalog?category=${cat.id}`)}
			>{cat.name}</button>
		{/each}
	</div>

	{#if data.products.length === 0}
		<p class="empty">{t().common.noResults}</p>
	{:else}
		<div class="product-grid">
			{#each data.products as product (product.id)}
				<div class="product-card">
					<div class="product-body">
						<div class="product-category">{product.category?.name ?? ''}</div>
						<h3 class="product-name">{product.name}</h3>
						<div class="product-sku">{product.sku}</div>
						{#if product.description}
							<p class="product-desc">{product.description}</p>
						{/if}
					</div>
					<div class="product-footer">
						<div class="product-pricing">
							<div class="contract-price">
								{formatCurrency(product.contract_price)}
								<span class="price-unit">/ {product.unit}</span>
							</div>
							{#if product.has_group_price}
								<div class="base-price-row">
									<span class="price-label">{t().catalog.basePrice}:</span>
									<span class="base-price">{formatCurrency(product.base_price)}</span>
								</div>
							{/if}
							<div class="tax-included">
								({t().catalog.contractPrice} incl. tax: {formatCurrency(calcTaxIncluded(product.contract_price, product.tax_rate))})
							</div>
						</div>
						<div class="product-meta">
							<span class="min-qty">{t().catalog.minQty} {product.min_order_qty} {t().catalog.unit} {product.unit}</span>
						</div>
						{#if product.stock_qty <= 0}
							<Button variant="secondary" disabled>{t().catalog.outOfStock}</Button>
						{:else}
							<div class="add-to-cart">
								{#if cartCount(product.id) > 0}
									<span class="in-cart">In cart: {cartCount(product.id)}</span>
								{/if}
								<Button onclick={() => addToCart(product)}>{t().catalog.addToCart}</Button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.page-title { font-size: 1.5rem; font-weight: 700; }
	.cart-link { text-decoration: none; }

	.category-tabs {
		display: flex;
		gap: 2px;
		flex-wrap: wrap;
	}

	.cat-tab {
		padding: var(--space-xs) var(--space-md);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		background: none;
		font-family: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);

		&:hover { background-color: var(--color-hover); }
		&.active {
			background-color: var(--color-primary);
			border-color: var(--color-primary);
			color: var(--color-primary-text);
		}
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--space-lg);
	}

	.product-card {
		display: flex;
		flex-direction: column;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: box-shadow var(--transition-fast);

		&:hover { box-shadow: var(--shadow-md); }
	}

	.product-body {
		flex: 1;
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.product-category { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-tertiary); }
	.product-name { font-size: 0.9375rem; font-weight: 600; }
	.product-sku { font-size: 0.75rem; color: var(--color-text-tertiary); }
	.product-desc { font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.4; margin-top: var(--space-xs); }

	.product-footer {
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		border-top: 1px solid var(--color-border-light);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.product-pricing { display: flex; flex-direction: column; gap: 2px; }

	.contract-price {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.price-unit { font-size: 0.75rem; font-weight: 400; color: var(--color-text-secondary); }

	.base-price-row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.75rem;
	}

	.price-label { color: var(--color-text-secondary); }
	.base-price { text-decoration: line-through; color: var(--color-text-tertiary); }

	.tax-included { font-size: 0.6875rem; color: var(--color-text-tertiary); }

	.product-meta { font-size: 0.75rem; color: var(--color-text-secondary); }
	.min-qty { }

	.add-to-cart {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.in-cart { font-size: 0.75rem; color: var(--color-success); font-weight: 500; }

	.empty { font-size: 0.875rem; color: var(--color-text-tertiary); text-align: center; padding: var(--space-3xl) 0; }
</style>
