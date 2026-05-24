export const ORDER_STATUSES = [
	'pending',
	'confirmed',
	'shipped',
	'completed',
	'cancelled'
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
