import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendEmailJobData, SendTemplateEmailJobData } from './interfaces/mail-job.interface';

export const MAIL_QUEUE_NAME = 'mail';

@Injectable()
export class MailQueue {
	constructor ( @InjectQueue( MAIL_QUEUE_NAME ) private readonly mailQueue: Queue ) { }

	/**
	 * Encola un job para enviar un email directo
	 */
	async addSendEmailJob ( data: SendEmailJobData, options?: { priority?: number; delay?: number } ): Promise<void> {
		await this.mailQueue.add( 'send-email', data, {
			priority: options?.priority || 0,
			delay: options?.delay || 0,
			attempts: 3,
			backoff: {
				type: 'exponential',
				delay: 2000,
			},
		} );
	}

	/**
	 * Encola un job para enviar un email con template
	 */
	async addSendTemplateEmailJob ( data: SendTemplateEmailJobData, options?: { priority?: number; delay?: number } ): Promise<void> {
		await this.mailQueue.add( 'send-template-email', data, {
			priority: options?.priority || 0,
			delay: options?.delay || 0,
			attempts: 3,
			backoff: {
				type: 'exponential',
				delay: 2000,
			},
		} );
	}

	/**
	 * Obtiene el estado de la cola
	 */
	async getQueueStatus (): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
		const [ waiting, active, completed, failed ] = await Promise.all( [
			this.mailQueue.getWaitingCount(),
			this.mailQueue.getActiveCount(),
			this.mailQueue.getCompletedCount(),
			this.mailQueue.getFailedCount(),
		] );

		return { waiting, active, completed, failed };
	}
}

