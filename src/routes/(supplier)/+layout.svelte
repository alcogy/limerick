<script lang="ts">
	import { Sidebar, ConfirmDialog } from '$lib/ui';
	import type { NavItem } from '$lib/ui';
	import { getTheme, setTheme } from '$lib/theme.svelte';
	import { t } from '$lib/i18n';
	import type { LayoutData } from './$types';
	import {
		LayoutDashboard,
		Package,
		Tag,
		Users,
		DollarSign,
		ShoppingCart,
		FileText,
		CircleUser,
		LogOut
	} from '@lucide/svelte';

	let { children, data }: { children: any; data: LayoutData } = $props();

	let showSignOutConfirm = $state(false);

	const primaryNavItems = $derived<NavItem[]>([
		{ href: '/supplier/dashboard', label: t().nav.dashboard, icon: LayoutDashboard },
		{ href: '/supplier/products', label: t().nav.products, icon: Package },
		{ href: '/supplier/categories', label: t().nav.categories, icon: Tag },
		{ href: '/supplier/buyers', label: t().nav.buyers, icon: Users },
		{ href: '/supplier/price-groups', label: t().nav.priceGroups, icon: DollarSign },
		{ href: '/supplier/orders', label: t().nav.orders, icon: ShoppingCart },
		{ href: '/supplier/invoices', label: t().nav.invoices, icon: FileText }
	]);

	const secondaryNavItems = $derived<NavItem[]>([
		{ href: '/supplier/profile', label: t().nav.profile, icon: CircleUser },
		{
			href: '/logout',
			label: t().nav.signOut,
			icon: LogOut,
			onclick: () => (showSignOutConfirm = true)
		}
	]);
</script>

<div class="app-shell">
	<Sidebar
		{primaryNavItems}
		{secondaryNavItems}
		theme={getTheme()}
		onthemechange={setTheme}
	>
		{#snippet logo()}
			<span class="logo-text">{t().app.name}</span>
		{/snippet}
	</Sidebar>

	<main class="main-content">
		{@render children()}
	</main>
</div>

<ConfirmDialog
	open={showSignOutConfirm}
	title={t().auth.signOut}
	message={t().auth.signOutConfirm}
	confirmLabel={t().auth.signOut}
	onconfirm={() => { window.location.href = '/logout'; }}
	oncancel={() => (showSignOutConfirm = false)}
/>

<style lang="scss">
	.app-shell {
		display: flex;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		margin-left: var(--sidebar-width);
		padding: var(--space-2xl);
		min-width: 0;
		transition: margin-left var(--transition-base);

		@media (max-width: 768px) {
			margin-left: 0;
			padding: var(--space-lg);
			padding-top: calc(var(--header-height) + var(--space-sm));
		}
	}

	.logo-text {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--sidebar-text-active);
		white-space: nowrap;
		letter-spacing: -0.02em;
	}
</style>
