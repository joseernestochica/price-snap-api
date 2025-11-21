import { IsOptional, IsString, IsEnum, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { EmailLogStatus } from '../entities/email-log.entity';

export class GetEmailLogsDto {
	@IsOptional()
	@Type( () => Number )
	page?: number = 1;

	@IsOptional()
	@Type( () => Number )
	limit?: number = 10;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsEnum( EmailLogStatus )
	status?: EmailLogStatus;

	@IsOptional()
	@IsString()
	template?: string;

	@IsOptional()
	@IsString()
	sortColumn?: string = 'createdAt';

	@IsOptional()
	@IsString()
	sortDirection?: 'ASC' | 'DESC' = 'DESC';
}

