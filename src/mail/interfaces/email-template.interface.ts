export interface EmailTemplateContext {
	[key: string]: any;
}

export interface EmailTemplateOptions {
	template: string;
	context: EmailTemplateContext;
	subject?: string;
	layout?: string;
}

