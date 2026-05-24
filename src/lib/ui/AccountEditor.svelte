<script lang="ts">
	import Modal from './Modal.svelte';
	import Input from './Input.svelte';
	import Label from './Label.svelte';
	import Button from './Button.svelte';
	import { enhance } from '$app/forms';

	interface AccountData {
		id?: string;
		name: string;
		email: string;
		role: 'admin' | 'general';
	}

	interface Props {
		open: boolean;
		account?: AccountData | null;
		onsave?: () => void;
	}

	let { open = $bindable(false), account, onsave }: Props = $props();

	const isEdit = $derived(!!account?.id);
	const actionUrl = $derived(isEdit ? '?/update' : '?/create');
</script>

<Modal bind:open title={isEdit ? 'Edit Account' : 'New Account'}>
	<form
		class="editor-form"
		method="POST"
		action={actionUrl}
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					open = false;
					onsave?.();
				}
				await update();
			};
		}}
	>
		{#if isEdit && account?.id}
			<input type="hidden" name="id" value={account.id} />
		{/if}

		<div class="field">
			<Label for="acct-name" required>Name</Label>
			<Input
				id="acct-name"
				name="name"
				value={account?.name || ''}
				placeholder="Full name"
				required
			/>
		</div>

		<div class="field">
			<Label for="acct-email" required>Email</Label>
			<Input
				id="acct-email"
				name="email"
				type="email"
				value={account?.email || ''}
				placeholder="user@company.com"
				required
			/>
		</div>

		<div class="field">
			<Label for="acct-role" required>Role</Label>
			<select id="acct-role" name="role" class="select" value={account?.role || 'general'}>
				<option value="general">General</option>
				<option value="admin">Admin</option>
			</select>
		</div>

		<div class="field">
			<Label for="acct-password">{isEdit ? 'New Password (optional)' : 'Password'}</Label>
			<Input
				id="acct-password"
				name="password"
				type="password"
				placeholder={isEdit ? 'Leave blank to keep unchanged' : 'Set password'}
				required={!isEdit}
			/>
		</div>

		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" variant="primary">{isEdit ? 'Save' : 'Create'}</Button>
		</div>
	</form>
</Modal>

<style lang="scss">
	.editor-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.select {
		height: 36px;
		padding: 0 var(--space-md);
		background-color: var(--color-input-bg);
		color: var(--color-text);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: 0.8125rem;

		&:focus {
			outline: none;
			border-color: var(--color-border-focus);
			box-shadow: 0 0 0 3px var(--color-primary-light);
		}
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
	}
</style>
