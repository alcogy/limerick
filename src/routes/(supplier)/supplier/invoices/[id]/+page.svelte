<script lang="ts">
	import { Button } from '$lib/ui';
	import { t, formatDate } from '$lib/i18n';
	import { formatCurrency } from '$lib/utils';
	import { Printer } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inv      = $derived(data.invoice);
	const supplier = $derived(data.supplier);

	const allItems = $derived(
		inv.invoice_orders.flatMap((io) => io.order?.items ?? [])
	);
</script>

<svelte:head>
	<title>{inv.invoice_number} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header no-print">
		<a href="/supplier/invoices" class="back-link">← {t().invoice.title}</a>
		<Button onclick={() => window.print()}>
			<Printer size={15} /> {t().common.printPdf}
		</Button>
	</div>

	<div class="invoice-sheet">
		<!-- ヘッダー：左＝請求書番号＋ステータス＋発注者、右＝発行者＋発行日＋支払期限 -->
		<div class="inv-header">
			<div class="inv-left">
				<h1 class="inv-title">{t().invoice.invoiceNumber}: {inv.invoice_number}</h1>
				<div class="inv-status badge badge-{inv.status}">{t().invoice.statuses[inv.status]}</div>
				<div class="buyer-block">
					<div class="buyer-name">{inv.buyer?.company_name}</div>
					{#if inv.buyer?.user?.name}<div class="buyer-sub">{inv.buyer.user.name}</div>{/if}
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
					<div class="meta-row"><span>{t().invoice.issuedAt}</span><span>{formatDate(inv.issued_at)}</span></div>
					<div class="meta-row"><span>{t().invoice.dueDate}</span><span>{formatDate(inv.due_date)}</span></div>
				</div>
			</div>
		</div>

		<!-- 対象期間 -->
		<div class="inv-period">
			<span class="period-label">{t().invoice.period}:</span>
			<span class="period-value">{formatDate(inv.period_from)} – {formatDate(inv.period_to)}</span>
		</div>

		<table class="inv-table">
			<thead>
				<tr>
					<th>{t().product.name}</th>
					<th class="num">{t().cart.unitPrice}</th>
					<th class="num">{t().cart.quantity}</th>
					<th class="num">Tax</th>
					<th class="num">{t().cart.subtotal}</th>
				</tr>
			</thead>
			<tbody>
				{#each allItems as item (item.id)}
					<tr>
						<td>{item.name}<div class="item-sku">{item.sku}</div></td>
						<td class="num">{formatCurrency(item.unit_price)}</td>
						<td class="num">{item.quantity}</td>
						<td class="num">{(item.tax_rate * 100).toFixed(0)}%</td>
						<td class="num">{formatCurrency(item.subtotal)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr><td colspan="4" class="num">{t().invoice.subtotal}</td><td class="num">{formatCurrency(inv.subtotal)}</td></tr>
				<tr><td colspan="4" class="num">{t().invoice.taxAmount}</td><td class="num">{formatCurrency(inv.tax_amount)}</td></tr>
				<tr class="total-row"><td colspan="4" class="num">{t().invoice.totalAmount}</td><td class="num">{formatCurrency(inv.total_amount)}</td></tr>
			</tfoot>
		</table>
	</div>
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); max-width: 800px; margin: 0 auto; }

	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.back-link { font-size: 0.875rem; color: var(--color-primary); }

	.invoice-sheet {
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

	.inv-left { display: flex; flex-direction: column; gap: var(--space-md); }
	.inv-title { font-size: 1.25rem; font-weight: 700; }
	.inv-status { width: fit-content; }

	.buyer-block { display: flex; flex-direction: column; gap: 2px; padding-top: var(--space-xs); }
	.buyer-label { font-size: 0.6875rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
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

	/* ── Period ── */
	.inv-period {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	.period-label { color: var(--color-text-secondary); }
	.period-value { font-weight: 600; }

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
		tfoot td { font-weight: 500; }
		.total-row td { font-size: 1rem; font-weight: 700; border-top: 2px solid var(--color-border); }
	}

	.item-sku { font-size: 0.75rem; color: var(--color-text-tertiary); }

	@media print {
		.no-print { display: none !important; }
		.invoice-sheet { border: none; box-shadow: none; padding: 0; }
	}
</style>
