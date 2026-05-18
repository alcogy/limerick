<script lang="ts">
	import { Button, ConfirmDialog, Input, Label, Modal, SearchBar, Table, Textarea } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editItem = $state<(typeof data.buyers)[0] | null>(null);
	let deleteId = $state<string | null>(null);
	let inviteId = $state<string | null>(null);
	let inviteUrl = $state<string | null>(null);
	let searchValue = $state(data.search || '');

	function closeOnSuccess() {
		return async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			await update();
			if (result.type === 'success') {
				showCreate = false;
				editItem = null;
				const f = form as Record<string, unknown> | null;
				if (f?.inviteUrl) { inviteUrl = f.inviteUrl as string; inviteId = null; }
			}
		};
	}

	const columns = [
		{ key: 'company_name', label: t().buyer.companyName },
		{ key: 'name', label: t().buyer.contactName },
		{ key: 'email', label: t().buyer.email },
		{ key: 'closing_day', label: t().buyer.closingDay, width: '80px' },
		{ key: 'status', label: t().buyer.title, width: '100px' }
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
			{:else if col.key === 'closing_day'}
				{row.closing_day}
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
				<Button size="sm" variant="danger" onclick={() => (deleteId = row.id)}>{t().common.delete}</Button>
			</div>
		{/snippet}
	</Table>
</div>

<!-- Create modal -->
<Modal bind:open={showCreate} title={t().buyer.new} size="lg">
	<form method="POST" action="?/create" use:enhance={closeOnSuccess()} class="form">
		{#if form?.error}<div class="form-error">{form.error}</div>{/if}
		<div class="form-grid">
			<div class="field">
				<Label for="company_name" required>{t().buyer.companyName}</Label>
				<Input id="company_name" name="company_name" required />
			</div>
			<div class="field">
				<Label for="name" required>{t().buyer.contactName}</Label>
				<Input id="name" name="name" required />
			</div>
		</div>
		<div class="field">
			<Label for="email" required>{t().buyer.email}</Label>
			<Input id="email" name="email" type="email" required />
		</div>
		<div class="form-grid">
			<div class="field">
				<Label for="price_group_id">{t().buyer.priceGroup}</Label>
				<select class="select" name="price_group_id" id="price_group_id">
					<option value="">—</option>
					{#each data.priceGroups as g (g.id)}
						<option value={g.id}>{g.name}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<Label for="closing_day">{t().buyer.closingDay}</Label>
				<Input id="closing_day" name="closing_day" type="number" value="20" min="1" max="31" />
				<p class="field-note">{t().buyer.closingDayNote}</p>
			</div>
		</div>
		<div class="field">
			<Label for="phone">{t().buyer.phone}</Label>
			<Input id="phone" name="phone" type="tel" />
		</div>
		<div class="field">
			<Label for="address">{t().buyer.address}</Label>
			<Textarea id="address" name="address" rows={2} />
		</div>
		<div class="field">
			<Label for="payment_terms">{t().buyer.paymentTerms}</Label>
			<Input id="payment_terms" name="payment_terms" />
		</div>
		<div class="field">
			<Label for="notes">{t().buyer.notes}</Label>
			<Textarea id="notes" name="notes" rows={2} />
		</div>
		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => (showCreate = false)}>{t().common.cancel}</Button>
			<Button type="submit">{t().common.save}</Button>
		</div>
	</form>
</Modal>

<!-- Edit modal -->
{#if editItem}
	<Modal open={!!editItem} title={t().buyer.edit} size="lg" onclose={() => (editItem = null)}>
		<form method="POST" action="?/update" use:enhance={closeOnSuccess()} class="form">
			<input type="hidden" name="id" value={editItem.id} />
			{#if form?.error}<div class="form-error">{form.error}</div>{/if}
			<div class="form-grid">
				<div class="field">
					<Label for="edit-company" required>{t().buyer.companyName}</Label>
					<Input id="edit-company" name="company_name" value={editItem.company_name} required />
				</div>
				<div class="field">
					<Label for="edit-name" required>{t().buyer.contactName}</Label>
					<Input id="edit-name" name="name" value={editItem.name} required />
				</div>
			</div>
			<div class="field">
				<Label>{t().buyer.email}</Label>
				<Input value={editItem.email} disabled />
			</div>
			<div class="form-grid">
				<div class="field">
					<Label for="edit-pg">{t().buyer.priceGroup}</Label>
					<select class="select" name="price_group_id" id="edit-pg">
						<option value="">—</option>
						{#each data.priceGroups as g (g.id)}
							<option value={g.id} selected={g.id === editItem.price_group_id}>{g.name}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<Label for="edit-cd">{t().buyer.closingDay}</Label>
					<Input id="edit-cd" name="closing_day" type="number" value={editItem.closing_day} min="1" max="31" />
				</div>
			</div>
			<div class="field">
				<Label for="edit-phone">{t().buyer.phone}</Label>
				<Input id="edit-phone" name="phone" value={editItem.phone ?? ''} />
			</div>
			<div class="field">
				<Label for="edit-addr">{t().buyer.address}</Label>
				<Textarea id="edit-addr" name="address" rows={2} value={editItem.address ?? ''} />
			</div>
			<div class="field">
				<Label for="edit-pt">{t().buyer.paymentTerms}</Label>
				<Input id="edit-pt" name="payment_terms" value={editItem.payment_terms ?? ''} />
			</div>
			<div class="field">
				<Label for="edit-notes">{t().buyer.notes}</Label>
				<Textarea id="edit-notes" name="notes" rows={2} value={editItem.notes ?? ''} />
			</div>
			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => (editItem = null)}>{t().common.cancel}</Button>
				<Button type="submit">{t().common.save}</Button>
			</div>
		</form>
	</Modal>
{/if}

<!-- Invite confirm -->
<ConfirmDialog
	open={!!inviteId}
	title={t().buyer.invite}
	message={t().buyer.invite + '?'}
	onconfirm={() => {
		if (!inviteId) return;
		const f = document.createElement('form');
		f.method = 'POST'; f.action = '?/invite';
		const i = document.createElement('input');
		i.name = 'buyer_id'; i.value = inviteId!;
		f.appendChild(i); document.body.appendChild(f); f.submit();
	}}
	oncancel={() => (inviteId = null)}
/>

<!-- Invite URL modal -->
<Modal open={!!inviteUrl} title={t().buyer.inviteSent} onclose={() => (inviteUrl = null)}>
	<div class="invite-result">
		<p class="invite-desc">{t().buyer.emailSent}</p>
		<div class="invite-url-box">
			<code class="invite-url">{inviteUrl}</code>
		</div>
		<Button onclick={() => { navigator.clipboard.writeText(inviteUrl ?? ''); }}>{t().common.close}</Button>
	</div>
</Modal>

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
	.form { display: flex; flex-direction: column; gap: var(--space-lg); }
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
	.field { display: flex; flex-direction: column; gap: var(--space-sm); }
	.select {
		height: 36px;
		padding: 0 var(--space-md);
		background-color: var(--color-input-bg);
		color: var(--color-text);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: 0.8125rem;
	}
	.field-note {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}

	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}
	.form-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
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
</style>
