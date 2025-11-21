import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailTemplateService } from './mail-template.service';
import { EmailTemplateContext } from './interfaces/email-template.interface';
import { MailQueue } from './queues/mail.queue';
import { EmailLogService } from './email-log.service';

@Injectable()
export class MailService {
	private readonly logger = new Logger( MailService.name );
	private transporter: nodemailer.Transporter;
	private readonly defaultFrom: string;

	constructor (
		private readonly configService: ConfigService,
		private readonly mailTemplateService: MailTemplateService,
		private readonly mailQueue: MailQueue,
		private readonly emailLogService: EmailLogService,
	) {

		const host = this.configService.get<string>( 'SMTP_HOST' );
		const port = this.configService.get<number>( 'SMTP_PORT' ) || 587;
		const secure = this.configService.get<string>( 'SMTP_SECURE', 'false' ) === 'true';
		const user = this.configService.get<string>( 'SMTP_USER' );
		const pass = this.configService.get<string>( 'SMTP_PASS' );
		this.defaultFrom = this.configService.get<string>( 'SMTP_FROM', user || 'no-reply@example.com' );

		// Configuración especial para diferentes proveedores
		const isGmail = host?.includes( 'gmail.com' );
		const isSendGrid = host?.includes( 'sendgrid.net' );

		if ( isGmail ) {
			// Para Gmail, usar 'service: gmail' simplifica la configuración
			this.transporter = nodemailer.createTransport( {
				service: 'gmail',
				auth: user && pass ? { user, pass } : undefined,
			} );
			this.logger.log( 'Configurado para Gmail con App Password' );
		} else if ( isSendGrid ) {
			// Para SendGrid, usar configuración SMTP estándar
			// SendGrid requiere SMTP_USER=apikey y SMTP_PASS=tu-api-key
			this.transporter = nodemailer.createTransport( {
				host: 'smtp.sendgrid.net',
				port: 587,
				secure: false,
				auth: user && pass ? { user, pass } : undefined,
			} );
			this.logger.log( 'Configurado para SendGrid' );
		} else {
			// Para otros proveedores SMTP, usar configuración estándar
			this.transporter = nodemailer.createTransport( {
				host,
				port,
				secure,
				auth: user && pass ? { user, pass } : undefined,
			} );
			this.logger.log( `Configurado para SMTP: ${ host }` );
		}

	}

	async sendEmail ( to: string, subject: string, html: string, from?: string, logId?: string ): Promise<string> {

		const fromAddress = from || this.defaultFrom;
		let emailLogId = logId;

		// Crear log si no existe
		if ( !emailLogId ) {
			try {
				const log = await this.emailLogService.createLog( {
					to,
					from: fromAddress,
					subject,
					html,
				} );
				emailLogId = log.id;
				this.logger.log( `Log creado con ID ${ emailLogId } para email a ${ to }` );
			} catch ( error ) {
				this.logger.error( `Error creando log (continuando con envío): ${ error.message }`, error.stack );
				// Continuar con el envío aunque falle el log
			}
		}

		try {
			await this.transporter.sendMail( { to, subject, html, from: fromAddress } );
			if ( emailLogId ) {
				try {
					await this.emailLogService.updateLogSuccess( emailLogId );
					this.logger.log( `Log ${ emailLogId } actualizado como enviado exitosamente` );
				} catch ( error ) {
					this.logger.error( `Error actualizando log como éxito: ${ error.message }` );
				}
			}
			this.logger.log( `Email enviado a ${ to } con asunto "${ subject }"` );
			return emailLogId || '';
		} catch ( error ) {
			if ( emailLogId ) {
				try {
					await this.emailLogService.updateLogFailure( emailLogId, error.message );
					this.logger.log( `Log ${ emailLogId } actualizado como fallido` );
				} catch ( logError ) {
					this.logger.error( `Error actualizando log como fallido: ${ logError.message }` );
				}
			}
			throw error;
		}

	}

	/**
	 * Envía un email usando un template de Handlebars
	 * @param to Email del destinatario
	 * @param template Nombre del template (sin extensión .hbs)
	 * @param context Contexto con datos para el template
	 * @param subject Asunto del email (opcional, puede venir del template)
	 * @param from Email del remitente (opcional)
	 */
	async sendTemplateEmail (
		to: string,
		template: string,
		context: EmailTemplateContext,
		subject?: string,
		from?: string,
		logId?: string,
	): Promise<string> {

		// Renderizar el template
		const html = this.mailTemplateService.renderTemplate( {
			template,
			context,
			subject,
		} );

		// Obtener el subject del template si no se proporcionó
		const emailSubject = subject || this.mailTemplateService.getSubject( template, context ) || 'Notificación de PriceSnap';

		const fromAddress = from || this.defaultFrom;
		let emailLogId = logId;

		// Crear log si no existe
		if ( !emailLogId ) {
			try {
				const log = await this.emailLogService.createLog( {
					to,
					from: fromAddress,
					subject: emailSubject,
					template,
					html,
					context,
				} );
				emailLogId = log.id;
				this.logger.log( `Log creado con ID ${ emailLogId } para template "${ template }" a ${ to }` );
			} catch ( error ) {
				this.logger.error( `Error creando log (continuando con envío): ${ error.message }`, error.stack );
				// Continuar con el envío aunque falle el log
			}
		}

		try {
			// Enviar el email
			const finalLogId = await this.sendEmail( to, emailSubject, html, from, emailLogId );
			this.logger.log( `Email con template "${ template }" enviado a ${ to }` );
			return finalLogId || emailLogId || '';
		} catch ( error ) {
			if ( emailLogId ) {
				try {
					await this.emailLogService.updateLogFailure( emailLogId, error.message );
					this.logger.log( `Log ${ emailLogId } actualizado como fallido` );
				} catch ( logError ) {
					this.logger.error( `Error actualizando log como fallido: ${ logError.message }` );
				}
			}
			throw error;
		}

	}

	/**
	 * Encola un job para enviar un email (procesamiento asíncrono)
	 * @param to Email del destinatario
	 * @param subject Asunto del email
	 * @param html Contenido HTML del email
	 * @param from Email del remitente (opcional)
	 * @param options Opciones de la cola (prioridad, delay)
	 */
	async queueSendEmail (
		to: string,
		subject: string,
		html: string,
		from?: string,
		options?: { priority?: number; delay?: number },
	): Promise<void> {
		await this.mailQueue.addSendEmailJob( { to, subject, html, from }, options );
		this.logger.log( `Job de email encolado para ${ to }` );
	}

	/**
	 * Encola un job para enviar un email con template (procesamiento asíncrono)
	 * @param to Email del destinatario
	 * @param template Nombre del template
	 * @param context Contexto con datos para el template
	 * @param subject Asunto del email (opcional)
	 * @param from Email del remitente (opcional)
	 * @param options Opciones de la cola (prioridad, delay)
	 */
	async queueSendTemplateEmail (
		to: string,
		template: string,
		context: EmailTemplateContext,
		subject?: string,
		from?: string,
		options?: { priority?: number; delay?: number },
	): Promise<void> {
		await this.mailQueue.addSendTemplateEmailJob( { to, template, context, subject, from }, options );
		this.logger.log( `Job de email con template "${ template }" encolado para ${ to }` );
	}
}

