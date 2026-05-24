export const TEMPLATE_IDS = ['invitation', 'order_message'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATE_DEFAULTS: Record<TemplateId, { subject: string; body: string }> = {
	invitation: {
		subject: "You've been invited to {{supplier_name}}'s ordering portal",
		body: `Dear {{buyer_name}},

You have been invited to access the wholesale ordering portal for {{supplier_name}}.

Please click the link below to set up your password and activate your account:
{{setup_url}}

This invitation expires on {{expires_at}}.`
	},
	order_message: {
		subject: 'Regarding your order #{{order_number}}',
		body: 'Dear {{buyer_name}},\n\n'
	}
};

export const TEMPLATE_VARIABLES: Record<TemplateId, string[]> = {
	invitation: ['buyer_name', 'company_name', 'supplier_name', 'setup_url', 'expires_at'],
	order_message: ['buyer_name', 'order_number']
};
