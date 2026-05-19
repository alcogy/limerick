<script lang="ts">
	import { Button } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { formatDate, formatDateTime, formatCurrency } from '$lib/utils';
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
		<div class="sheet-header">
			<div class="title-block">
				<h1 class="sheet-title">{t().order.printTitle}</h1>
				<div class="order-id-label">#{order.id.slice(0, 8).toUpperCase()}</div>
				<div class="badge badge-{order.status}">{t().order.statuses[order.status]}</div>
			</div>
			<div class="sheet-meta">
				<div class="meta-row"><span>{t().order.orderedAt}</span><span>{formatDateTime(order.ordered_at)}</span></div>
			</div>
		</div>

		<div class="parties">
			{#if supplier.name}
				<div class="party">
					<div class="party-label">{t().order.to}</div>
					<div class="party-name">{supplier.name}</div>
					{#if supplier.address}<div class="party-sub">{supplier.address}</div>{/if}
					{#if supplier.zip}<div class="party-sub">{supplier.zip}</div>{/if}
					{#if supplier.tel}<div class="party-sub">{supplier.tel}</div>{/if}
					{#if supplier.taxNo}<div class="party-sub party-tax">{supplier.taxNo}</div>{/if}
				</div>
			{/if}
			<div class="party">
				<div class="party-label">{t().order.orderedBy}</div>
				<div class="party-name">{order.buyer?.company_name}</div>
				<div class="party-sub">{order.buyer?.user?.name}</div>
			</div>
		</div>

		<table class="items-table">
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

	.sheet-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-lg); }
	.title-block { display: flex; flex-direction: column; gap: var(--space-sm); }
	.sheet-title { font-size: 1.25rem; font-weight: 700; }
	.order-id-label { font-size: 0.8125rem; color: var(--color-text-tertiary); font-family: var(--font-mono); }

	.sheet-meta { display: flex; flex-direction: column; gap: var(--space-xs); text-align: right; }
	.meta-row { display: flex; gap: var(--space-lg); font-size: 0.875rem; }
	.meta-row span:first-child { color: var(--color-text-secondary); }

	.parties {
		display: flex;
		gap: var(--space-2xl);
		padding: var(--space-lg);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
	}

	.party { display: flex; flex-direction: column; gap: 2px; }
	.party-label { font-size: 0.75rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
	.party-name { font-size: 0.9375rem; font-weight: 600; }
	.party-sub { font-size: 0.8125rem; color: var(--color-text-secondary); }
	.party-tax { font-size: 0.75rem; font-family: var(--font-mono); margin-top: 2px; }

	.items-table {
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
