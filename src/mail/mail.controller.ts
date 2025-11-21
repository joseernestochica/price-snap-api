import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendTemplateEmailDto } from './dto/send-template-email.dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';

@Controller( 'mail' )
export class MailController {
	constructor ( private readonly mailService: MailService ) { }

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
}

