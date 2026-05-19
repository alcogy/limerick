<script lang="ts">
	import { Button } from '$lib/ui';
	import { t, formatDateTime } from '$lib/i18n';
	import { formatCurrency } from '$lib/utils';
	import { Printer } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const order    = $derived(data.order);
	const supplier = $derived(data.supplier);
</script>

<svelte:head>
	<title>{t().order.printTitle} — {order.id.slice(0, 8)} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header no-print">
		<a href="/buyer/orders" class="back-link">← {t().order.title}</a>
		<Button onclick={() => window.print()}>
			<Printer size={15} /> {t().common.printPdf}
		</Button>
	</div>

	<div class="order-sheet">
		<!-- ヘッダー：左＝注文書タイトル＋ステータス＋発注者、右＝宛先＋発注日 -->
		<div class="inv-header">
			<div class="inv-left">
				<h1 class="inv-title">{t().order.printTitle}</h1>
				<div class="order-id-label">#{order.id.slice(0, 8).toUpperCase()}</div>
				<div class="badge badge-{order.status}">{t().order.statuses[order.status]}</div>
				<div class="buyer-block">
					<div class="buyer-name">{order.buyer?.company_name}</div>
					{#if order.buyer?.user?.name}<div class="buyer-sub">{order.buyer.user.name}</div>{/if}
					{#if order.buyer?.zip}<div class="buyer-sub">{order.buyer.zip}</div>{/if}
					{#if order.buyer?.address}<div class="buyer-sub">{order.buyer.address}</div>{/if}
				</div>
			</div>
			<div class="inv-right">
				{#if supplier.name}
					<div class="supplier-block">
						<div class="supplier-name">{supplier.name}</div>
						{#if supplier.zip}<div class="supplier-sub">{supplier.zip}</div>{/if}
						{#if supplier.address}<div class="supplier-sub">{supplier.address}</div>{/if}
						{#if supplier.tel}<div class="supplier-sub">{supplier.tel}</div>{/if}
						{#if supplier.taxNo}<div class="supplier-tax">{supplier.taxNo}</div>{/if}
					</div>
				{/if}
				<div class="inv-meta">
					<div class="meta-row"><span>{t().order.orderedAt}</span><span>{formatDateTime(order.ordered_at)}</span></div>
				</div>
			</div>
		</div>

		<table class="inv-table">
			<thead>
				<tr>
					<th>{t().product.sku}</th>
					<th>{t().product.name}</th>
					<th class="num">{t().cart.unitPrice}</th>
					<th class="num">Tax</th>
					<th class="num">{t().cart.quantity}</th>
					<th class="num">{t().cart.subtotal}</th>
				</tr>
			</thead>
			<tbody>
				{#each order.items as item (item.id)}
					<tr>
						<td class="sku-cell">{item.sku}</td>
						<td>{item.name}</td>
						<td class="num">{formatCurrency(item.unit_price)}</td>
						<td class="num">{(item.tax_rate * 100).toFixed(0)}%</td>
						<td class="num">{item.quantity}</td>
						<td class="num">{formatCurrency(item.subtotal)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr><td colspan="5" class="num">{t().order.totalAmount}</td><td class="num">{formatCurrency(order.total_amount)}</td></tr>
				<tr><td colspan="5" class="num">{t().order.taxAmount}</td><td class="num">{formatCurrency(order.tax_amount)}</td></tr>
				<tr class="grand-row"><td colspan="5" class="num">{t().order.grandTotal}</td><td class="num">{formatCurrency(order.total_amount + order.tax_amount)}</td></tr>
			</tfoot>
		</table>

		{#if order.notes}
			<div class="notes-section">
				<div class="notes-label">{t().order.notes}</div>
				<div class="notes-body">{order.notes}</div>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); max-width: 800px; margin: 0 auto; }

	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.back-link { font-size: 0.875rem; color: var(--color-primary); }

	.order-sheet {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: var(--space-2xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	/* ── Header ── */
	.inv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-xl); }

	.inv-left { display: flex; flex-direction: column; gap: var(--space-sm); }
	.inv-title { font-size: 1.25rem; font-weight: 700; }
	.order-id-label { font-size: 0.8125rem; color: var(--color-text-tertiary); font-family: var(--font-mono); }

	.buyer-block { display: flex; flex-direction: column; gap: 2px; padding-top: var(--space-xs); }
	.buyer-name { font-size: 0.9375rem; font-weight: 600; }
	.buyer-sub { font-size: 0.8125rem; color: var(--color-text-secondary); }

	.inv-right { display: flex; flex-direction: column; gap: var(--space-md); align-items: flex-end; text-align: right; }

	.supplier-block { display: flex; flex-direction: column; gap: 2px; }
	.supplier-name { font-size: 0.9375rem; font-weight: 600; }
	.supplier-sub { font-size: 0.8125rem; color: var(--color-text-secondary); }
	.supplier-tax { font-size: 0.75rem; font-family: var(--font-mono); color: var(--color-text-secondary); margin-top: 2px; }

	.inv-meta { display: flex; flex-direction: column; gap: var(--space-xs); }
	.meta-row { display: flex; gap: var(--space-lg); font-size: 0.875rem; }
	.meta-row span:first-child { color: var(--color-text-secondary); }

	/* ── Table ── */
	.inv-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;

		th, td {
			padding: var(--space-sm) var(--space-md);
			border-bottom: 1px solid var(--color-border-light);
			text-align: left;
			&.num { text-align: right; }
		}

		th { font-weight: 600; color: var(--color-text-secondary); background-color: var(--color-bg-sunken); }
		.sku-cell { font-family: var(--font-mono); font-size: 0.8125rem; color: var(--color-text-tertiary); }
		tfoot td { font-weight: 500; }
		.grand-row td { font-size: 1rem; font-weight: 700; border-top: 2px solid var(--color-border); }
	}

	/* ── Notes ── */
	.notes-section {
		padding: var(--space-lg);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
	}
	.notes-label { font-size: 0.75rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-xs); }
	.notes-body { font-size: 0.875rem; }

	@media print {
		.no-print { display: none !important; }
		.order-sheet { border: none; box-shadow: none; padding: 0; }
	}
</style>
