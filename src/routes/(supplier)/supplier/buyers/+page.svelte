<script lang="ts">
	import { Button, BuyerForm, ConfirmDialog, Modal, SearchBar, Table } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t, formatDate } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editItem = $state<(typeof data.buyers)[0] | null>(null);
	let deleteId = $state<string | null>(null);
	let inviteId = $state<string | null>(null);
	let inviteUrl = $state<string | null>(null);
	let searchValue = $state(data.search || '');

	const inviteEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') {
			const url = (result as { data?: { inviteUrl?: string } }).data?.inviteUrl;
			if (url) { inviteUrl = url; inviteId = null; }
		}
	};

	const columns = [
		{ key: 'company_name', label: t().buyer.companyName },
		{ key: 'name',         label: t().buyer.contactName },
		{ key: 'email',        label: t().buyer.email },
		{ key: 'closing_day',  label: t().buyer.closingDay,   width: '80px' },
		{ key: 'status',       label: t().common.status,      width: '100px' },
		{ key: 'invitation',   label: t().buyer.inviteExpiry, width: '140px' }
	];
</script>

<svelte:head>
	<title>{t().buyer.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().buyer.title}</h1>
		<Button onclick={() => (showCreate = true)}>{t().buyer.new}</Button>
	</div>

	<SearchBar bind:value={searchValue} onsearch={() => goto(searchValue ? `?search=${searchValue}` : '?')} />

	<Table {columns} rows={data.buyers}>
		{#snippet cell(col, row)}
			{#if col.key === 'status'}
				<span class="badge badge-{row.is_active ? 'active' : 'inactive'}">
					{row.is_active ? t().buyer.activated : t().buyer.pending}
				</span>
			{:else if col.key === 'invitation'}
				{#if row.is_active}
					—
				{:else if row.invitation}
					<span class="invite-expiry" class:expired={row.invitation.expired}>
						{formatDate(row.invitation.expires_at)}
						{#if row.invitation.expired}<span class="expire-badge">Expired</span>{/if}
					</span>
				{:else}
					<span class="no-invite">—</span>
				{/if}
			{:else}
				{(row as Record<string, unknown>)[col.key] ?? ''}
			{/if}
		{/snippet}
		{#snippet actions(row)}
			<div class="row-actions">
				<Button size="sm" variant="ghost" onclick={() => (inviteId = row.id)}>
					{row.is_active ? t().buyer.resendInvite : t().buyer.invite}
				</Button>
				<Button size="sm" variant="secondary" onclick={() => (editItem = row)}>{t().common.edit}</Button>
				<Button size="sm" variant="danger"    onclick={() => (deleteId = row.id)}>{t().common.delete}</Button>
			</div>
		{/snippet}
	</Table>
</div>

<!-- Create modal -->
<Modal bind:open={showCreate} title={t().buyer.new} size="lg">
	<BuyerForm
		priceGroups={data.priceGroups}
		error={form?.error}
		onclose={() => (showCreate = false)}
	/>
</Modal>

<!-- Edit modal -->
{#if editItem}
	<Modal open={!!editItem} title={t().buyer.edit} size="lg" onclose={() => (editItem = null)}>
		<BuyerForm
			priceGroups={data.priceGroups}
			buyer={editItem}
			error={form?.error}
			onclose={() => (editItem = null)}
		/>
	</Modal>
{/if}

<!-- Invite confirm -->
<ConfirmDialog
	open={!!inviteId}
	title={t().buyer.invite}
	message={t().buyer.invite + '?'}
	onconfirm={() => {
		document.getElementById('invite-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
	}}
	oncancel={() => (inviteId = null)}
/>
<form
	id="invite-form"
	method="POST"
	action="?/invite"
	use:enhance={inviteEnhance}
	style="display:none"
>
	<input name="buyer_id" value={inviteId ?? ''} />
</form>

<!-- Invite URL result -->
<Modal open={!!inviteUrl} title={t().buyer.inviteSent} onclose={() => (inviteUrl = null)}>
	<div class="invite-result">
		<p class="invite-desc">{t().buyer.emailSent}</p>
		<div class="invite-url-box">
			<code class="invite-url">{inviteUrl}</code>
		</div>
		<Button onclick={() => { navigator.clipboard.writeText(inviteUrl ?? ''); }}>
			Copy link
		</Button>
	</div>
</Modal>

<!-- Delete confirm -->
<ConfirmDialog
	open={!!deleteId}
	title={t().buyer.delete}
	message={t().buyer.deleteConfirm}
	onconfirm={() => {
		if (!deleteId) return;
		const f = document.createElement('form');
		f.method = 'POST'; f.action = '?/delete';
		const i = document.createElement('input');
		i.name = 'id'; i.value = deleteId!;
		f.appendChild(i); document.body.appendChild(f); f.submit();
	}}
	oncancel={() => (deleteId = null)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.page-title { font-size: 1.5rem; font-weight: 700; }
	.row-actions { display: flex; gap: var(--space-xs); justify-content: flex-end; }

	.invite-result { display: flex; flex-direction: column; gap: var(--space-lg); }
	.invite-desc { font-size: 0.875rem; }
	.invite-url-box {
		padding: var(--space-md);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		overflow: auto;
	}
	.invite-url { font-size: 0.75rem; word-break: break-all; }

	.invite-expiry { font-size: 0.8125rem; display: flex; align-items: center; gap: var(--space-xs); }
	.invite-expiry.expired { color: var(--color-danger); }
	.expire-badge {
		font-size: 0.6875rem; font-weight: 600;
		padding: 1px 5px;
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-sm);
	}
	.no-invite { color: var(--color-text-tertiary); }
</style>
