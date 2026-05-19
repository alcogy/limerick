<script lang="ts">
	import { Button, Modal, Input } from '$lib/ui';
	import { t, formatDateTime } from '$lib/i18n';
	import { formatCurrency } from '$lib/utils';
	import type { PageData } from './$types';

	interface ReorderItem {
		id: string; name: string; sku: string;
		price: number; tax_rate: number; unit: string; min_qty: number; qty: number;
	}

	let { data }: { data: PageData } = $props();

	let viewOrder = $state<(typeof data.orders)[0] | null>(null);
	let reorderItems = $state<ReorderItem[]>([]);

	function openReorder(order: (typeof data.orders)[0]) {
		// Use current product data (price, tax_rate, min_qty) when available;
		// fall back to order-time snapshot only if product was deleted.
		reorderItems = order.items
			.filter((item) => item.product?.is_active)
			.map((item) => ({
				id: item.product_id,
				name: item.product?.name ?? item.name,
				sku: item.product?.sku ?? item.sku,
				price: item.product?.base_price ?? item.unit_price,
				tax_rate: item.product?.tax_rate ?? item.tax_rate,
				unit: item.product?.unit ?? 'ea',
				min_qty: item.product?.min_order_qty ?? 1,
				qty: Math.max(item.product?.min_order_qty ?? 1, item.quantity)
			}));
	}

	function confirmReorder() {
		localStorage.setItem('limerick_cart', JSON.stringify(reorderItems));
		window.location.href = '/buyer/cart';
	}
</script>

<svelte:head>
	<title>{t().order.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().order.title}</h1>

	{#if data.placed}
		<div class="success-banner">{t().cart.orderPlaced}</div>
	{/if}

	{#if data.orders.length === 0}
		<p class="empty">{t().common.noResults}</p>
	{:else}
		<div class="order-list">
			{#each data.orders as order (order.id)}
				<div class="order-card">
					<div class="order-header">
						<div class="order-meta">
							<code class="order-id">{order.id.slice(0, 8)}…</code>
							<span class="badge badge-{order.status}">{t().order.statuses[order.status]}</span>
						</div>
						<div class="order-date">{formatDateTime(order.ordered_at)}</div>
					</div>
					<div class="order-items-preview">
						{#each order.items.slice(0, 3) as item (item.id)}
							<span class="item-name">{item.name} ×{item.quantity}</span>
						{/each}
						{#if order.items.length > 3}
							<span class="more-items">+{order.items.length - 3} more</span>
						{/if}
					</div>
					<div class="order-footer">
						<span class="order-total">{formatCurrency(order.total_amount + order.tax_amount)}</span>
						<div class="order-actions">
							<Button size="sm" variant="secondary" onclick={() => (viewOrder = order)}>{t().common.details}</Button>
							<a href="/buyer/orders/{order.id}" target="_blank" class="print-link">
								<Button size="sm" variant="ghost">{t().cart.printOrder}</Button>
							</a>
							<Button size="sm" variant="ghost" onclick={() => openReorder(order)}>{t().cart.reorder}</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Order detail modal -->
{#if viewOrder}
	<Modal open={!!viewOrder} title={t().order.detail} size="lg" onclose={() => (viewOrder = null)}>
		<div class="order-detail">
			<div class="detail-rows">
				<div class="detail-row">
					<span class="detail-label">{t().order.status}</span>
					<span class="badge badge-{viewOrder.status}">{t().order.statuses[viewOrder.status]}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">{t().order.orderedAt}</span>
					<span>{formatDateTime(viewOrder.ordered_at)}</span>
				</div>
				{#if viewOrder.notes}
					<div class="detail-row">
						<span class="detail-label">{t().order.notes}</span>
						<span>{viewOrder.notes}</span>
					</div>
				{/if}
			</div>

			<table class="items-table">
				<thead>
					<tr>
						<th>{t().product.name}</th>
						<th class="num">{t().cart.unitPrice}</th>
						<th class="num">{t().cart.quantity}</th>
						<th class="num">{t().cart.subtotal}</th>
					</tr>
				</thead>
				<tbody>
					{#each viewOrder.items as item (item.id)}
						<tr>
							<td>{item.name}</td>
							<td class="num">{formatCurrency(item.unit_price)}</td>
							<td class="num">{item.quantity}</td>
							<td class="num">{formatCurrency(item.subtotal)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr><td colspan="3" class="num">{t().order.totalAmount}</td><td class="num">{formatCurrency(viewOrder.total_amount)}</td></tr>
					<tr><td colspan="3" class="num">{t().order.taxAmount}</td><td class="num">{formatCurrency(viewOrder.tax_amount)}</td></tr>
					<tr class="grand"><td colspan="3" class="num">{t().order.grandTotal}</td><td class="num">{formatCurrency(viewOrder.total_amount + viewOrder.tax_amount)}</td></tr>
				</tfoot>
			</table>
		</div>
	</Modal>
{/if}

<!-- Reorder modal -->
{#if reorderItems.length > 0}
	<Modal open={reorderItems.length > 0} title={t().cart.reorder} size="md" onclose={() => (reorderItems = [])}>
		<div class="reorder-content">
			<p class="reorder-desc">{t().cart.reorderDesc}</p>
			<p class="reorder-price-note">{t().cart.reorderPriceNote}</p>
			<div class="reorder-list">
				{#each reorderItems as item, i (item.id)}
					<div class="reorder-row">
						<div class="reorder-info">
							<span class="reorder-name">{item.name}</span>
							<span class="reorder-sku">{item.sku} / {item.unit} — {formatCurrency(item.price)}</span>
						</div>
						<div class="reorder-qty">
							<button class="qty-btn" disabled={item.qty <= item.min_qty}
								onclick={() => { reorderItems[i] = { ...item, qty: item.qty - 1 }; }}>−</button>
							<span class="qty-val">{item.qty}</span>
							<button class="qty-btn"
								onclick={() => { reorderItems[i] = { ...item, qty: item.qty + 1 }; }}>+</button>
						</div>
						<span class="reorder-price">{formatCurrency(item.price * item.qty)}</span>
					</div>
				{/each}
			</div>
			<div class="reorder-actions">
				<Button variant="secondary" onclick={() => (reorderItems = [])}>{t().common.cancel}</Button>
				<Button variant="primary" onclick={confirmReorder}>{t().cart.checkout}</Button>
			</div>
		</div>
	</Modal>
{/if}

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.success-banner {
		padding: var(--space-md) var(--space-lg);
		background-color: var(--color-success-light);
		color: var(--color-success);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.order-list { display: flex; flex-direction: column; gap: var(--space-md); }

	.order-card {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.order-header { display: flex; align-items: center; justify-content: space-between; }
	.order-meta { display: flex; align-items: center; gap: var(--space-sm); }
	.order-id { font-size: 0.75rem; color: var(--color-text-tertiary); }
	.order-date { font-size: 0.75rem; color: var(--color-text-tertiary); }

	.order-items-preview {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.item-name {
		font-size: 0.8125rem;
		padding: 2px var(--space-sm);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
	}

	.more-items { font-size: 0.75rem; color: var(--color-text-tertiary); align-self: center; }

	.order-footer { display: flex; align-items: center; justify-content: space-between; }
	.order-total { font-size: 1rem; font-weight: 700; }
	.order-actions { display: flex; gap: var(--space-xs); }
	.print-link { text-decoration: none; }

	.order-detail { display: flex; flex-direction: column; gap: var(--space-xl); }
	.detail-rows { display: flex; flex-direction: column; gap: var(--space-sm); }
	.detail-row { display: flex; gap: var(--space-md); font-size: 0.875rem; }
	.detail-label { width: 100px; flex-shrink: 0; color: var(--color-text-secondary); }

	.items-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;

		th, td {
			padding: var(--space-sm) var(--space-md);
			border-bottom: 1px solid var(--color-border-light);
			text-align: left;
			&.num { text-align: right; }
		}

		th { font-weight: 600; color: var(--color-text-secondary); background-color: var(--color-bg-sunken); }

		.grand td { font-weight: 700; font-size: 0.9375rem; border-top: 2px solid var(--color-border); }
	}

	.empty { font-size: 0.875rem; color: var(--color-text-tertiary); text-align: center; padding: var(--space-3xl) 0; }

	.reorder-content { display: flex; flex-direction: column; gap: var(--space-md); }
	.reorder-desc { font-size: 0.8125rem; color: var(--color-text-secondary); }
	.reorder-price-note {
		font-size: 0.75rem;
		color: var(--color-warning, #b45309);
		background-color: var(--color-warning-light, #fef3c7);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
	}

	.reorder-list { display: flex; flex-direction: column; gap: 0; }

	.reorder-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--color-border-light);
		&:last-child { border-bottom: none; }
	}

	.reorder-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
	.reorder-name { font-size: 0.875rem; font-weight: 500; }
	.reorder-sku { font-size: 0.75rem; color: var(--color-text-tertiary); }

	.reorder-qty {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.qty-btn {
		width: 26px; height: 26px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: none;
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		&:hover:not(:disabled) { background-color: var(--color-hover); }
		&:disabled { opacity: 0.35; cursor: not-allowed; }
	}

	.qty-val { width: 36px; text-align: center; font-size: 0.875rem; font-weight: 600; }
	.reorder-price { font-size: 0.875rem; font-weight: 600; white-space: nowrap; min-width: 70px; text-align: right; }
	.reorder-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
</style>
