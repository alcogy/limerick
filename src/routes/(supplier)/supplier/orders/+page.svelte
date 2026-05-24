<script lang="ts">
	import { Button, Pagination, Table } from '$lib/ui';
	import { t, formatDateTime } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { formatCurrency } from '$lib/utils';
	import { PAGE_SIZE_LIST } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const ORDER_STATUSES = ['', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'] as const;

	const columns = [
		{ key: 'id', label: t().order.orderNumber, width: '160px' },
		{ key: 'buyer', label: t().order.buyer },
		{ key: 'status', label: t().order.status, width: '110px' },
		{ key: 'total', label: t().order.grandTotal, width: '130px' },
		{ key: 'ordered_at', label: t().order.orderedAt, width: '160px' }
	];
</script>

<svelte:head>
	<title>{t().order.supplierTitle} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().order.supplierTitle}</h1>
		<a href="/supplier/orders/export" class="export-link">
			<Button variant="secondary">{t().order.exportCsv}</Button>
		</a>
	</div>

	<div class="status-tabs">
		{#each ORDER_STATUSES as s (s)}
			<button
				class="status-tab"
				class:active={data.statusFilter === s}
				onclick={() => {
					const p = new URLSearchParams();
					if (s) p.set('status', s);
					goto(`?${p}`);
				}}
			>
				{s ? t().order.statuses[s] : t().common.all}
			</button>
		{/each}
	</div>

	<Table {columns} rows={data.orders} onrowclick={(row) => goto(`/supplier/orders/${row.id}`)}>
		{#snippet cell(col, row)}
			{#if col.key === 'id'}
				<code class="order-id">{row.id.slice(0, 8).toUpperCase()}</code>
			{:else if col.key === 'buyer'}
				{row.buyer?.company_name ?? '—'}
			{:else if col.key === 'status'}
				<span class="badge badge-{row.status}">{t().order.statuses[row.status]}</span>
			{:else if col.key === 'total'}
				{formatCurrency(row.total_amount + row.tax_amount)}
			{:else if col.key === 'ordered_at'}
				{formatDateTime(row.ordered_at)}
			{:else}
				{(row as Record<string, unknown>)[col.key] ?? ''}
			{/if}
		{/snippet}
	</Table>

	<Pagination
		currentPage={data.page}
		totalPages={data.totalPages}
		totalItems={data.total}
		itemsPerPage={PAGE_SIZE_LIST}
		onpagechange={(p) => {
			const params = new URLSearchParams(window.location.search);
			params.set('page', String(p));
			goto(`?${params}`);
		}}
	/>
</div>

<style lang="scss">
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.export-link {
		text-decoration: none;
	}

	.status-tabs {
		display: flex;
		gap: 1px;
		background-color: var(--color-bg-sunken);
		padding: 2px;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
		flex-wrap: wrap;
		width: fit-content;
	}

	.status-tab {
		padding: 4px var(--space-md);
		border: none;
		background: none;
		border-radius: calc(var(--radius-md) - 2px);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		font-family: inherit;
		transition: all var(--transition-fast);
		&.active {
			background-color: var(--color-bg-elevated);
			color: var(--color-text);
			box-shadow: var(--shadow-sm);
		}
	}

	.order-id {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}
</style>
