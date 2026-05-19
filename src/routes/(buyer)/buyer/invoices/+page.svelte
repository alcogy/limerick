<script lang="ts">
	import { t, formatDate } from '$lib/i18n';
	import { formatCurrency } from '$lib/utils';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
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
				<button class="invoice-row" onclick={() => goto(`/buyer/invoices/${invoice.id}`)}>
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

	.empty { font-size: 0.875rem; color: var(--color-text-tertiary); text-align: center; padding: var(--space-3xl) 0; }
</style>
