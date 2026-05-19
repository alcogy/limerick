<script lang="ts">
	import { Card } from '$lib/ui';
	import { Package, Users, ShoppingCart, AlertCircle } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils';
	import { t, formatDateTime } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const stats = $derived([
		{ label: t().dashboard.stats.products,     value: data.stats.products,     icon: Package,       color: 'blue' },
		{ label: t().dashboard.stats.buyers,        value: data.stats.buyers,        icon: Users,         color: 'green' },
		{ label: t().dashboard.stats.pendingOrders, value: data.stats.pendingOrders, icon: AlertCircle,   color: 'orange' }
	]);
</script>

<svelte:head>
	<title>{t().dashboard.title} — {t().app.name}</title>
</svelte:head>

<div class="dashboard">
	<h1 class="page-title">{t().dashboard.title}</h1>

	<div class="stats-grid">
		{#each stats as stat (stat.label)}
			<div class="stat-card">
				<div class="stat-icon {stat.color}"><stat.icon size={20} /></div>
				<div class="stat-info">
					<span class="stat-value">{stat.value}</span>
					<span class="stat-label">{stat.label}</span>
				</div>
			</div>
		{/each}
	</div>

	<Card title={t().dashboard.recentOrders}>
		{#if data.recentOrders.length > 0}
			<div class="order-list">
				{#each data.recentOrders as order (order.id)}
					<a href="/supplier/orders/{order.id}" class="order-item">
						<div class="order-main">
							<span class="order-buyer">{order.buyer?.company_name ?? '—'}</span>
							<span class="badge badge-{order.status}">{t().order.statuses[order.status]}</span>
						</div>
						<div class="order-meta">
							<span class="order-amount">{formatCurrency(order.total_amount + order.tax_amount)}</span>
							<span class="order-date">{formatDateTime(order.ordered_at)}</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<p class="empty">{t().common.noResults}</p>
		{/if}
	</Card>
</div>

<style lang="scss">
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xl);
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: var(--space-lg);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		flex-shrink: 0;

		&.blue   { background-color: #dbeafe; color: #1d4ed8; }
		&.green  { background-color: #dcfce7; color: #15803d; }
		&.orange { background-color: #ffedd5; color: #c2410c; }
	}

	.stat-info { display: flex; flex-direction: column; }
	.stat-value { font-size: 1.5rem; font-weight: 700; line-height: 1; }
	.stat-label { font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 2px; }

	.order-list { display: flex; flex-direction: column; }

	.order-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--color-border-light);
		color: var(--color-text);
		text-decoration: none;

		&:last-child { border-bottom: none; }
		&:hover { color: var(--color-primary); }
	}

	.order-main {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.order-buyer {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.order-meta {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		flex-shrink: 0;
	}

	.order-amount {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.order-date {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
		white-space: nowrap;
	}

	.empty {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		padding: var(--space-lg) 0;
		text-align: center;
	}
</style>
