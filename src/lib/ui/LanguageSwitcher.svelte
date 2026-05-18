<script lang="ts">
	import { t, getLocale, setLocale, LOCALES, type Locale } from '$lib/i18n';
</script>

<div class="lang-switcher">
	{#each LOCALES as locale (locale.value)}
		<button
			class="lang-btn"
			class:active={getLocale() === locale.value}
			onclick={() => setLocale(locale.value as Locale)}
		>
			<span class="lang-native">{locale.nativeLabel}</span>
			<span class="lang-label">{locale.label}</span>
		</button>
	{/each}
</div>

<style lang="scss">
	.lang-switcher {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-width: 320px;
	}

	.lang-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md) var(--space-lg);
		border: 2px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		background-color: var(--color-bg-elevated);
		cursor: pointer;
		font-family: inherit;
		transition:
			border-color var(--transition-fast),
			background-color var(--transition-fast);

		&:hover:not(.active) {
			background-color: var(--color-hover);
			border-color: var(--color-border);
		}

		&.active {
			border-color: var(--color-primary);
			background-color: var(--color-primary-light);
		}
	}

	.lang-native {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.lang-label {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}
</style>
