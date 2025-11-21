export interface SendEmailJobData {
	to: string;
	subject: string;
	html: string;
	from?: string;
	logId?: string;
}

export interface SendTemplateEmailJobData {
	to: string;
	template: string;
	context: Record<string, any>;
	subject?: string;
	from?: string;
	logId?: string;
}

export enum MailJobType {
	SEND_EMAIL = 'send-email',
	SEND_TEMPLATE_EMAIL = 'send-template-email',
}

