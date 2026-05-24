<script lang="ts">
	import { Button, Input, Label } from '$lib/ui';
	import { t } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{t().auth.setupPassword} — {t().app.name}</title>
</svelte:head>

<div class="setup-page">
	<div class="setup-card">
		<div class="setup-header">
			<h1 class="setup-title">{t().app.name}</h1>
			<p class="setup-subtitle">{t().auth.setupPasswordDesc}</p>
		</div>

		{#if !data.valid}
			<div class="error-block" role="alert">
				{t().auth.invalidToken}
				<a href="/login">{t().auth.signIn}</a>
			</div>
		{:else}
			<form method="POST" class="setup-form">
				<input type="hidden" name="token" value={data.token} />

				{#if form?.error}
					<div class="form-error" role="alert">{form.error}</div>
				{/if}

				<div class="field">
					<Label>{t().auth.email}</Label>
					<Input type="email" value={data.email} disabled />
				</div>

				<div class="field">
					<Label for="password" required>{t().auth.newPassword}</Label>
					<Input
						id="password"
						type="password"
						name="password"
						autocomplete="new-password"
						required
					/>
				</div>

				<div class="field">
					<Label for="confirm" required>{t().auth.confirmPassword}</Label>
					<Input id="confirm" type="password" name="confirm" autocomplete="new-password" required />
				</div>

				<Button type="submit" variant="primary" size="lg" style="width:100%">
					{t().auth.activateAccount}
				</Button>
			</form>
		{/if}
	</div>
</div>

<style lang="scss">
	.setup-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-lg);
	}

	.setup-card {
		width: 100%;
		max-width: 400px;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		padding: var(--space-2xl);
	}

	.setup-header {
		text-align: center;
		margin-bottom: var(--space-xl);
	}

	.setup-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.setup-subtitle {
		margin-top: var(--space-xs);
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.form-error,
	.error-block {
		padding: var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
