<script lang="ts">
	import { Pagination } from '$lib/ui';
	import { t, formatDateTime } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const ACTION_BADGES: Record<string, string> = {
		create: 'active', update: 'info', delete: 'danger',
		cancel: 'warning', login: 'info', logout: 'inactive',
		export: 'info'
	};

	function actionLabel(action: string): string {
		const map = t().auditLog.actions as Record<string, string>;
		return map[action] ?? action;
	}
</script>

<svelte:head>
	<title>{t().auditLog.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().auditLog.title}</h1>

	<div class="log-table-wrap">
		<table class="log-table">
			<thead>
				<tr>
					<th>{t().auditLog.date}</th>
					<th>{t().auditLog.user}</th>
					<th>{t().auditLog.action}</th>
					<th>{t().auditLog.resource}</th>
					<th>{t().auditLog.id}</th>
					<th>{t().auditLog.metadata}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.logs as log (log.id)}
					{@const user = log.user_id ? data.userMap[log.user_id] : null}
					<tr>
						<td class="date-cell">{formatDateTime(log.created_at)}</td>
						<td class="user-cell">
							{#if user}
								<span class="user-name">{user.name}</span>
								<span class="user-email">{user.email}</span>
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td><span class="badge badge-{ACTION_BADGES[log.action] ?? 'info'}">{actionLabel(log.action)}</span></td>
						<td class="resource-cell">{log.resource_type}</td>
						<td class="id-cell"><code>{log.resource_id?.slice(0, 8) ?? '—'}</code></td>
						<td class="meta-cell">
							{#if log.metadata}
								<code class="meta">{log.metadata}</code>
							{/if}
						</td>
					</tr>
				{/each}
				{#if data.logs.length === 0}
					<tr><td colspan="6" class="empty">{t().auditLog.empty}</td></tr>
				{/if}
			</tbody>
		</table>
	</div>

	<Pagination
		currentPage={data.page}
		totalPages={data.totalPages}
		totalItems={data.totalPages * 30}
		itemsPerPage={30}
		onpagechange={(p) => {
			const params = new URLSearchParams(window.location.search);
			params.set('page', String(p));
			goto(`?${params}`);
		}}
	/>
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.log-table-wrap {
		overflow-x: auto;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
	}

	.log-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;

		th, td {
			padding: var(--space-sm) var(--space-md);
			border-bottom: 1px solid var(--color-border-light);
			text-align: left;
			white-space: nowrap;
		}

		th { font-weight: 600; color: var(--color-text-secondary); background-color: var(--color-bg-sunken); }
		tr:last-child td { border-bottom: none; }
		tr:hover td { background-color: var(--color-hover); }
	}

	.date-cell { color: var(--color-text-secondary); font-size: 0.75rem; }
	.user-cell { display: flex; flex-direction: column; gap: 1px; }
	.user-name { font-weight: 500; }
	.user-email { font-size: 0.75rem; color: var(--color-text-tertiary); }
	.resource-cell { font-family: var(--font-mono); }
	.id-cell code { font-size: 0.75rem; color: var(--color-text-tertiary); }
	.meta-cell { max-width: 240px; overflow: hidden; }
	.meta { font-size: 0.75rem; color: var(--color-text-secondary); word-break: break-all; white-space: normal; }
	.muted { color: var(--color-text-tertiary); }
	.empty { text-align: center; color: var(--color-text-tertiary); padding: var(--space-2xl); }

	.badge-info { background-color: var(--color-primary-light, #dbeafe); color: var(--color-primary); }
	.badge-warning { background-color: #fef3c7; color: #b45309; }
</style>
