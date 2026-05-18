<script lang="ts">
	import { Modal } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let viewInvoice = $state<(typeof data.invoices)[0] | null>(null);
</script>

<svelte:head>
	<title>{t().invoice.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().invoice.title}</h1>

	{#if data.invoices.length === 0}
		<p class="empty">{t().common.noResults}</p>
	{:else}
		<div class="invoice-list">
			{#each data.invoices as invoice (invoice.id)}
				<button class="invoice-row" onclick={() => (viewInvoice = invoice)}>
					<div class="invoice-main">
						<span class="invoice-number">{invoice.invoice_number}</span>
						<span class="invoice-period">{formatDate(invoice.period_from)} – {formatDate(invoice.period_to)}</span>
					</div>
					<div class="invoice-right">
						<span class="invoice-amount">{formatCurrency(invoice.total_amount)}</span>
						<span class="badge badge-{invoice.status}">{t().invoice.statuses[invoice.status]}</span>
						<span class="invoice-due">{t().invoice.dueDate}: {formatDate(invoice.due_date)}</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- Invoice detail modal -->
{#if viewInvoice}
	<Modal open={!!viewInvoice} title="{t().invoice.detail}: {viewInvoice.invoice_number}" size="md" onclose={() => (viewInvoice = null)}>
		<div class="invoice-detail">
			<div class="detail-rows">
				<div class="detail-row"><span class="detail-label">{t().invoice.invoiceNumber}</span><span>{viewInvoice.invoice_number}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.periodFrom}</span><span>{formatDate(viewInvoice.period_from)}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.periodTo}</span><span>{formatDate(viewInvoice.period_to)}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.dueDate}</span><span>{formatDate(viewInvoice.due_date)}</span></div>
				<div class="detail-row">
					<span class="detail-label">{t().common.status}</span>
					<span class="badge badge-{viewInvoice.status}">{t().invoice.statuses[viewInvoice.status]}</span>
				</div>
				<div class="detail-row"><span class="detail-label">{t().invoice.issuedAt}</span><span>{formatDate(viewInvoice.issued_at)}</span></div>
			</div>

			<div class="amount-rows">
				<div class="amount-row"><span>{t().invoice.subtotal}</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div>
				<div class="amount-row"><span>{t().invoice.taxAmount}</span><span>{formatCurrency(viewInvoice.tax_amount)}</span></div>
				<div class="amount-row total"><span>{t().invoice.totalAmount}</span><span>{formatCurrency(viewInvoice.total_amount)}</span></div>
			</div>
			<div class="print-action">
				<a href="/buyer/invoices/{viewInvoice.id}" target="_blank" class="print-link">
					Print / PDF
				</a>
			</div>
		</div>
	</Modal>
{/if}

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.invoice-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.invoice-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border-light);
		transition: background-color var(--transition-fast);

		&:last-child { border-bottom: none; }
		&:hover { background-color: var(--color-hover); }
	}

	.invoice-main { display: flex; flex-direction: column; gap: 2px; }
	.invoice-number { font-size: 0.875rem; font-weight: 600; }
	.invoice-period { font-size: 0.75rem; color: var(--color-text-secondary); }

	.invoice-right {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex-shrink: 0;
	}

	.invoice-amount { font-size: 1rem; font-weight: 700; }
	.invoice-due { font-size: 0.75rem; color: var(--color-text-tertiary); }

	.invoice-detail { display: flex; flex-direction: column; gap: var(--space-xl); }
	.detail-rows { display: flex; flex-direction: column; gap: var(--space-sm); }
	.detail-row { display: flex; gap: var(--space-md); font-size: 0.875rem; }
	.detail-label { width: 120px; flex-shrink: 0; color: var(--color-text-secondary); }

	.amount-rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
	}

	.amount-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;

		&.total {
			font-size: 1rem;
			font-weight: 700;
			padding-top: var(--space-sm);
			border-top: 1px solid var(--color-border-light);
			margin-top: var(--space-xs);
		}
	}

	.empty { font-size: 0.875rem; color: var(--color-text-tertiary); text-align: center; padding: var(--space-3xl) 0; }
	.print-action { display: flex; justify-content: flex-end; padding-top: var(--space-sm); }
	.print-link { font-size: 0.875rem; color: var(--color-primary); }
</style>
