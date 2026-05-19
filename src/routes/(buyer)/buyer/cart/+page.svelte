<script lang="ts">
	import { Button, ConfirmDialog, Textarea, Label } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import { formatCurrency, calcTaxIncluded } from '$lib/utils';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	interface CartItem { id: string; name: string; sku: string; price: number; tax_rate: number; unit: string; min_qty: number; qty: number }

	function readCart(): CartItem[] {
		if (typeof localStorage === 'undefined') return [];
		try {
			const raw = localStorage.getItem('limerick_cart');
			return raw ? JSON.parse(raw) : [];
		} catch { return []; }
	}

	let cart: CartItem[] = $state(readCart());
	let notes = $state('');
	let showConfirm = $state(false);

	function saveCart() { localStorage.setItem('limerick_cart', JSON.stringify(cart)); }

	function updateQty(id: string, delta: number) {
		const item = cart.find((c) => c.id === id);
		if (!item) return;
		item.qty = Math.max(item.min_qty, item.qty + delta);
		cart = [...cart];
		saveCart();
	}

	function removeItem(id: string) {
		cart = cart.filter((c) => c.id !== id);
		saveCart();
	}

	const subtotal = $derived(cart.reduce((s, c) => s + c.price * c.qty, 0));
	const taxEstimate = $derived(cart.reduce((s, c) => s + Math.floor(c.price * c.qty * c.tax_rate), 0));
	const grandTotal = $derived(subtotal + taxEstimate);
</script>

<svelte:head>
	<title>{t().cart.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().cart.title}</h1>
		<a href="/buyer/catalog" class="continue-link">{t().cart.continueShopping}</a>
	</div>

	{#if cart.length === 0}
		<div class="empty-cart">
			<p class="empty-text">{t().cart.empty}</p>
			<a href="/buyer/catalog">
				<Button variant="primary">{t().cart.continueShopping}</Button>
			</a>
		</div>
	{:else}
		<div class="cart-layout">
			<div class="cart-items">
				{#each cart as item (item.id)}
					<div class="cart-item">
						<div class="item-info">
							<div class="item-name">{item.name}</div>
							<div class="item-sku">{item.sku}</div>
						</div>
						<div class="item-price">{formatCurrency(item.price)} / {item.unit}</div>
						<div class="qty-control">
							<button class="qty-btn" onclick={() => updateQty(item.id, -1)} disabled={item.qty <= item.min_qty}>−</button>
							<span class="qty-value">{item.qty}</span>
							<button class="qty-btn" onclick={() => updateQty(item.id, 1)}>+</button>
						</div>
						<div class="item-subtotal">{formatCurrency(item.price * item.qty)}</div>
						<button class="remove-btn" onclick={() => removeItem(item.id)} aria-label="Remove">✕</button>
					</div>
				{/each}
			</div>

			<div class="cart-summary">
				<div class="summary-card">
					<div class="summary-rows">
						<div class="summary-row"><span>{t().cart.total}</span><span>{formatCurrency(subtotal)}</span></div>
						<div class="summary-row"><span>{t().cart.tax}</span><span>{formatCurrency(taxEstimate)}</span></div>
						<div class="summary-row grand"><span>{t().cart.grandTotal}</span><span>{formatCurrency(grandTotal)}</span></div>
					</div>

					<div class="notes-field">
						<Label for="notes">{t().cart.notes}</Label>
						<Textarea id="notes" rows={3} placeholder={t().cart.notesPlaceholder} bind:value={notes} />
					</div>

					<Button variant="primary" size="lg" onclick={() => (showConfirm = true)} style="width:100%">
						{t().cart.checkout}
					</Button>
				</div>
			</div>
		</div>

		<!-- Hidden form for checkout POST -->
		<form id="checkout-form" method="POST" action="?/checkout" use:enhance onsubmit={() => { localStorage.removeItem('limerick_cart'); }}>
			<input type="hidden" name="items" value={JSON.stringify(cart.map((c) => ({ id: c.id, qty: c.qty, price: c.price, tax_rate: c.tax_rate, name: c.name, sku: c.sku })))} />
			<input type="hidden" name="notes" value={notes} />
		</form>
	{/if}
</div>

<ConfirmDialog
	open={showConfirm}
	title={t().cart.checkout}
	message={t().cart.confirmCheckout}
	onconfirm={() => {
		(document.getElementById('checkout-form') as HTMLFormElement)?.submit();
	}}
	oncancel={() => (showConfirm = false)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.page-title { font-size: 1.5rem; font-weight: 700; }
	.continue-link { font-size: 0.875rem; color: var(--color-primary); }

	.empty-cart {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xl);
		padding: var(--space-3xl) 0;
	}

	.empty-text { color: var(--color-text-secondary); }

	.cart-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-xl);
		align-items: start;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}
	}

	.cart-items { display: flex; flex-direction: column; gap: 0; }

	.cart-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--color-border-light);

		&:first-child { border-top: 1px solid var(--color-border-light); }
	}

	.item-info { flex: 1; min-width: 0; }
	.item-name { font-size: 0.875rem; font-weight: 500; }
	.item-sku { font-size: 0.75rem; color: var(--color-text-tertiary); }

	.item-price { font-size: 0.8125rem; color: var(--color-text-secondary); white-space: nowrap; }

	.qty-control {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.qty-btn {
		width: 28px;
		height: 28px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: none;
		color: var(--color-text);
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover:not(:disabled) { background-color: var(--color-hover); }
		&:disabled { opacity: 0.35; cursor: not-allowed; }
	}

	.qty-value { width: 40px; text-align: center; font-size: 0.875rem; font-weight: 600; }

	.item-subtotal { font-size: 0.875rem; font-weight: 600; white-space: nowrap; min-width: 80px; text-align: right; }

	.remove-btn {
		width: 24px;
		height: 24px;
		border: none;
		background: none;
		color: var(--color-text-tertiary);
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		flex-shrink: 0;

		&:hover { background-color: var(--color-danger-light); color: var(--color-danger); }
	}

	.summary-card {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.summary-rows { display: flex; flex-direction: column; gap: var(--space-sm); }

	.summary-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;

		&.grand {
			font-size: 1.0625rem;
			font-weight: 700;
			padding-top: var(--space-sm);
			border-top: 1px solid var(--color-border-light);
			margin-top: var(--space-xs);
		}
	}

	.notes-field { display: flex; flex-direction: column; gap: var(--space-sm); }
</style>
