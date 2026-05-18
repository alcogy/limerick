<script lang="ts">
	import { Button, Input, Label } from '$lib/ui';
	import { t } from '$lib/i18n';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Setup — {t().app.name}</title>
</svelte:head>

<div class="setup-page">
	<div class="setup-card">
		<div class="setup-header">
			<h1 class="setup-title">{t().app.name}</h1>
			<h2 class="setup-subtitle">Initial Setup</h2>
			<p class="setup-desc">Create the administrator account to get started.</p>
		</div>

		<form method="POST" class="setup-form">
			{#if form?.error}
				<div class="form-error" role="alert">{form.error}</div>
			{/if}

			<div class="field">
				<Label for="name" required>Your name</Label>
				<Input id="name" name="name" placeholder="Admin" required />
			</div>
			<div class="field">
				<Label for="email" required>{t().auth.email}</Label>
				<Input id="email" name="email" type="email" placeholder="admin@example.com" autocomplete="email" required />
			</div>
			<div class="field">
				<Label for="password" required>{t().auth.password}</Label>
				<Input id="password" name="password" type="password" autocomplete="new-password" required />
			</div>
			<div class="field">
				<Label for="confirm" required>{t().auth.confirmPassword}</Label>
				<Input id="confirm" name="confirm" type="password" autocomplete="new-password" required />
			</div>

			<Button type="submit" variant="primary" size="lg" style="width:100%">
				Create account &amp; start
			</Button>
		</form>
	</div>
</div>

<style lang="scss">
	.setup-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-lg);
		background-color: var(--color-bg);
	}

	.setup-card {
		width: 100%;
		max-width: 420px;
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
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.setup-subtitle {
		font-size: 1rem;
		font-weight: 600;
		margin-top: var(--space-xs);
		color: var(--color-text);
	}

	.setup-desc {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		margin-top: var(--space-xs);
	}

	.setup-form { display: flex; flex-direction: column; gap: var(--space-lg); }
	.field { display: flex; flex-direction: column; gap: var(--space-sm); }

	.form-error {
		padding: var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}
</style>
