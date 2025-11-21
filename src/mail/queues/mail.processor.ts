import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../mail.service';
import { EmailLogService } from '../email-log.service';
import { SendEmailJobData, SendTemplateEmailJobData } from './interfaces/mail-job.interface';
import { MAIL_QUEUE_NAME } from './mail.queue';

@Processor( MAIL_QUEUE_NAME )
export class MailProcessor extends WorkerHost {
	private readonly logger = new Logger( MailProcessor.name );

	constructor (
		private readonly mailService: MailService,
		private readonly emailLogService: EmailLogService,
	) {
		super();
	}

	async process ( job: Job<SendEmailJobData | SendTemplateEmailJobData> ): Promise<void> {
		this.logger.log( `Procesando job ${ job.id } de tipo ${ job.name }` );

		let logId: string | undefined = undefined;

		try {
			if ( job.name === 'send-email' ) {
				const data = job.data as SendEmailJobData;
				logId = data.logId;

				// Crear log si no existe
				if ( !logId ) {
					const log = await this.emailLogService.createLog( {
						to: data.to,
						from: data.from,
						subject: data.subject,
						html: data.html,
						jobId: job.id?.toString(),
					} );
					logId = log.id;
				} else {
					// Incrementar intentos si el log ya existe
					await this.emailLogService.incrementAttempts( logId );
				}

				await this.mailService.sendEmail( data.to, data.subject, data.html, data.from, logId );
				this.logger.log( `Email enviado exitosamente para job ${ job.id }` );
			} else if ( job.name === 'send-template-email' ) {
				const data = job.data as SendTemplateEmailJobData;
				logId = data.logId;

				// Crear log si no existe
				if ( !logId ) {
					const log = await this.emailLogService.createLog( {
						to: data.to,
						from: data.from,
						subject: data.subject || 'Generated from template',
						template: data.template,
						context: data.context,
						jobId: job.id?.toString(),
					} );
					logId = log.id;
				} else {
					// Incrementar intentos si el log ya existe
					await this.emailLogService.incrementAttempts( logId );
				}

				await this.mailService.sendTemplateEmail(
					data.to,
					data.template,
					data.context,
					data.subject,
					data.from,
					logId
				);
				this.logger.log( `Email con template "${ data.template }" enviado exitosamente para job ${ job.id }` );
			} else {
				throw new Error( `Tipo de job desconocido: ${ job.name }` );
			}
		} catch ( error ) {
			this.logger.error( `Error procesando job ${ job.id }: ${ error.message }`, error.stack );
			if ( logId ) {
				await this.emailLogService.updateLogFailure( logId, error.message );
			}
			throw error; // Re-lanzar para que BullMQ maneje el reintento
		}
	}
}

