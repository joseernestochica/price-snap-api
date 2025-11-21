import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SendTemplateEmailDto {
	@IsEmail()
	to: string;

	@IsString()
	@IsNotEmpty()
	template: string;

	@IsObject()
	@IsNotEmpty()
	context: Record<string, any>;

	@IsOptional()
	@IsString()
	subject?: string;

	@IsOptional()
	@IsString()
	from?: string;
}

