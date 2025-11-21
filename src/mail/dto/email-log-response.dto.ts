import { EmailLogStatus } from '../entities/email-log.entity';

export class EmailLogResponseDto {
	id: string;
	to: string;
	from: string;
	subject: string;
	template: string | null;
	status: EmailLogStatus;
	error: string | null;
	sentAt: Date | null;
	attempts: number;
	jobId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

