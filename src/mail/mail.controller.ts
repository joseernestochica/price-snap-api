import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendTemplateEmailDto } from './dto/send-template-email.dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { MailQueue } from './queues/mail.queue';

@Controller( 'mail' )
export class MailController {
	constructor (
		private readonly mailService: MailService,
		private readonly mailQueue: MailQueue,
	) { }

	@Post( 'send' )
	@Auth( ValidRoles.admin )
	async send ( @Body() dto: SendEmailDto ) {

		await this.mailService.sendEmail( dto.to, dto.subject, dto.html, dto.from );

		return {
			ok: true,
			message: 'Email sent successfully',
			statusCode: 200,
			data: {
				to: dto.to,
				subject: dto.subject,
				html: dto.html,
				from: dto.from
			}
		};

	}

	@Post( 'send-template' )
	@Auth( ValidRoles.admin )
	async sendTemplate ( @Body() dto: SendTemplateEmailDto ) {

		await this.mailService.sendTemplateEmail(
			dto.to,
			dto.template,
			dto.context,
			dto.subject,
			dto.from
		);

		return {
			ok: true,
			message: 'Email with template sent successfully',
			statusCode: 200,
			data: {
				to: dto.to,
				template: dto.template,
				subject: dto.subject || 'Generated from template',
				from: dto.from
			}
		};

	}

	@Post( 'send-queue' )
	@Auth( ValidRoles.admin )
	async sendQueue ( @Body() dto: SendEmailDto, @Query( 'useQueue' ) useQueue?: string ) {

		const shouldUseQueue = useQueue === 'true' || useQueue === '1';

		if ( shouldUseQueue ) {
			await this.mailService.queueSendEmail( dto.to, dto.subject, dto.html, dto.from );
			return {
				ok: true,
				message: 'Email job queued successfully',
				statusCode: 200,
				data: {
					to: dto.to,
					subject: dto.subject,
					from: dto.from,
					queued: true
				}
			};
		}

		await this.mailService.sendEmail( dto.to, dto.subject, dto.html, dto.from );

		return {
			ok: true,
			message: 'Email sent successfully',
			statusCode: 200,
			data: {
				to: dto.to,
				subject: dto.subject,
				html: dto.html,
				from: dto.from
			}
		};

	}

	@Post( 'send-template-queue' )
	@Auth( ValidRoles.admin )
	async sendTemplateQueue ( @Body() dto: SendTemplateEmailDto, @Query( 'useQueue' ) useQueue?: string ) {

		const shouldUseQueue = useQueue === 'true' || useQueue === '1';

		if ( shouldUseQueue ) {
			await this.mailService.queueSendTemplateEmail(
				dto.to,
				dto.template,
				dto.context,
				dto.subject,
				dto.from
			);
			return {
				ok: true,
				message: 'Email template job queued successfully',
				statusCode: 200,
				data: {
					to: dto.to,
					template: dto.template,
					subject: dto.subject || 'Generated from template',
					from: dto.from,
					queued: true
				}
			};
		}

		await this.mailService.sendTemplateEmail(
			dto.to,
			dto.template,
			dto.context,
			dto.subject,
			dto.from
		);

		return {
			ok: true,
			message: 'Email with template sent successfully',
			statusCode: 200,
			data: {
				to: dto.to,
				template: dto.template,
				subject: dto.subject || 'Generated from template',
				from: dto.from
			}
		};

	}

	@Get( 'queue-status' )
	@Auth( ValidRoles.admin )
	async getQueueStatus () {

		const status = await this.mailQueue.getQueueStatus();

		return {
			ok: true,
			message: 'Queue status retrieved successfully',
			statusCode: 200,
			data: status
		};

	}
}

