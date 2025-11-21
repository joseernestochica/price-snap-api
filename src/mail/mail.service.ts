import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
	private readonly logger = new Logger( MailService.name );
	private transporter: nodemailer.Transporter;
	private readonly defaultFrom: string;

	constructor ( private readonly configService: ConfigService ) {

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

	async sendEmail ( to: string, subject: string, html: string, from?: string ): Promise<void> {

		const fromAddress = from || this.defaultFrom;
		await this.transporter.sendMail( { to, subject, html, from: fromAddress } );
		this.logger.log( `Email enviado a ${ to } con asunto "${ subject }"` );

	}
}

