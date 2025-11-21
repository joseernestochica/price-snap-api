import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { EmailTemplateContext, EmailTemplateOptions } from './interfaces/email-template.interface';

@Injectable()
export class MailTemplateService {
	private readonly logger = new Logger( MailTemplateService.name );
	private readonly templatesPath: string;
	private readonly defaultLayout = 'default';
	private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
	private compiledPartials: Map<string, HandlebarsTemplateDelegate> = new Map();
	private compiledLayouts: Map<string, HandlebarsTemplateDelegate> = new Map();

	constructor ( private readonly configService: ConfigService ) {
		// Resolver la ruta de templates de forma robusta
		// En desarrollo con ts-node: __dirname puede apuntar a src/mail o dist/mail
		// En producción: __dirname apunta a dist/mail

		// Primero intentar desde __dirname (funciona en producción y algunos casos de desarrollo)
		let templatesPath = path.join( __dirname, 'templates' );

		// Si no existe, intentar rutas alternativas
		if ( !fs.existsSync( templatesPath ) ) {
			// Intentar desde src (desarrollo)
			const srcPath = path.join( process.cwd(), 'src', 'mail', 'templates' );
			if ( fs.existsSync( srcPath ) ) {
				templatesPath = srcPath;
			} else {
				// Intentar desde dist (producción o desarrollo compilado)
				const distPath = path.join( process.cwd(), 'dist', 'mail', 'templates' );
				if ( fs.existsSync( distPath ) ) {
					templatesPath = distPath;
				} else {
					// Último intento: desde __dirname navegando hacia atrás
					const altPath = path.join( __dirname, '..', '..', 'src', 'mail', 'templates' );
					if ( fs.existsSync( altPath ) ) {
						templatesPath = altPath;
					}
				}
			}
		}

		this.templatesPath = templatesPath;
		this.logger.log( `Templates path resolved to: ${ this.templatesPath }` );

		if ( !fs.existsSync( this.templatesPath ) ) {
			this.logger.error( `Templates directory not found at: ${ this.templatesPath }` );
			throw new Error( `Templates directory not found. Checked: ${ this.templatesPath }` );
		}

		this.registerHelpers();
		this.loadPartials();
		this.loadLayouts();
	}

	/**
	 * Registra helpers personalizados de Handlebars
	 */
	private registerHelpers (): void {
		// Helper para formatear JSON
		Handlebars.registerHelper( 'json', ( context: any ) => {
			return JSON.stringify( context, null, 2 );
		} );

		// Helper para formatear moneda
		Handlebars.registerHelper( 'currency', ( value: number, currency: string = 'EUR' ) => {
			return new Intl.NumberFormat( 'es-ES', {
				style: 'currency',
				currency: currency,
			} ).format( value );
		} );

		// Helper para formatear porcentaje
		Handlebars.registerHelper( 'percentage', ( value: number ) => {
			return `${ value > 0 ? '+' : '' }${ value.toFixed( 2 ) }%`;
		} );

		// Helper para comparar valores
		Handlebars.registerHelper( 'eq', ( a: any, b: any ) => {
			return a === b;
		} );

		// Helper para comparar mayor que
		Handlebars.registerHelper( 'gt', ( a: number, b: number ) => {
			return a > b;
		} );
	}

	/**
	 * Carga y registra los partials de Handlebars
	 */
	private loadPartials (): void {
		const partialsDir = path.join( this.templatesPath, 'partials' );

		if ( !fs.existsSync( partialsDir ) ) {
			this.logger.warn( `Partials directory not found: ${ partialsDir }` );
			return;
		}

		const files = fs.readdirSync( partialsDir );

		files.forEach( ( file ) => {
			if ( file.endsWith( '.hbs' ) ) {
				const partialName = path.basename( file, '.hbs' );
				const filePath = path.join( partialsDir, file );
				const templateContent = fs.readFileSync( filePath, 'utf-8' );
				const compiled = Handlebars.compile( templateContent );

				Handlebars.registerPartial( partialName, compiled );
				this.compiledPartials.set( partialName, compiled );

				this.logger.log( `Partial loaded: ${ partialName }` );
			}
		} );
	}

	/**
	 * Carga los layouts
	 */
	private loadLayouts (): void {
		const layoutsDir = path.join( this.templatesPath, 'layouts' );

		if ( !fs.existsSync( layoutsDir ) ) {
			this.logger.warn( `Layouts directory not found: ${ layoutsDir }` );
			return;
		}

		const files = fs.readdirSync( layoutsDir );

		files.forEach( ( file ) => {
			if ( file.endsWith( '.hbs' ) ) {
				const layoutName = path.basename( file, '.hbs' );
				const filePath = path.join( layoutsDir, file );
				const templateContent = fs.readFileSync( filePath, 'utf-8' );
				const compiled = Handlebars.compile( templateContent );

				this.compiledLayouts.set( layoutName, compiled );
				this.logger.log( `Layout loaded: ${ layoutName }` );
			}
		} );
	}

	/**
	 * Compila un template si no está en cache
	 */
	private getTemplate ( templateName: string ): HandlebarsTemplateDelegate {
		if ( this.compiledTemplates.has( templateName ) ) {
			return this.compiledTemplates.get( templateName )!;
		}

		const templatePath = path.join( this.templatesPath, 'emails', `${ templateName }.hbs` );

		if ( !fs.existsSync( templatePath ) ) {
			this.logger.error( `Template not found: ${ templateName } at path: ${ templatePath }` );
			this.logger.error( `Templates directory: ${ this.templatesPath }` );
			this.logger.error( `Available templates: ${ fs.existsSync( path.join( this.templatesPath, 'emails' ) ) ? fs.readdirSync( path.join( this.templatesPath, 'emails' ) ).join( ', ' ) : 'emails directory not found' }` );
			throw new Error( `Template not found: ${ templateName }. Checked path: ${ templatePath }` );
		}

		const templateContent = fs.readFileSync( templatePath, 'utf-8' );
		const compiled = Handlebars.compile( templateContent );

		this.compiledTemplates.set( templateName, compiled );
		this.logger.log( `Template compiled: ${ templateName }` );

		return compiled;
	}

	/**
	 * Obtiene el layout compilado
	 */
	private getLayout ( layoutName: string ): HandlebarsTemplateDelegate {
		if ( this.compiledLayouts.has( layoutName ) ) {
			return this.compiledLayouts.get( layoutName )!;
		}

		throw new Error( `Layout not found: ${ layoutName }` );
	}

	/**
	 * Renderiza un template de email con su layout
	 */
	renderTemplate ( options: EmailTemplateOptions ): string {
		const { template, context, layout = this.defaultLayout } = options;

		// Obtener el template compilado
		const templateDelegate = this.getTemplate( template );

		// Preparar el contexto con variables globales
		const enrichedContext = this.enrichContext( context, options.subject );

		// Renderizar el body del template
		const body = templateDelegate( enrichedContext );

		// Obtener el layout compilado
		const layoutDelegate = this.getLayout( layout );

		// Renderizar el layout con el body
		const html = layoutDelegate( {
			...enrichedContext,
			body,
		} );

		return html;
	}

	/**
	 * Enriquece el contexto con variables globales de configuración
	 */
	private enrichContext ( context: EmailTemplateContext, subject?: string ): EmailTemplateContext {
		const brandName = this.configService.get<string>( 'EMAIL_BRAND_NAME', 'PriceSnap' );
		const brandColor = this.configService.get<string>( 'EMAIL_PRIMARY_COLOR', '#007bff' );
		const footerText = this.configService.get<string>( 'EMAIL_FOOTER_TEXT', '© 2024 PriceSnap. Todos los derechos reservados.' );
		const appUrl = this.configService.get<string>( 'APP_URL', 'http://localhost:4200' );

		return {
			...context,
			brandName,
			brandColor,
			footerText,
			appUrl,
			subject: subject || context.subject || 'Notificación de PriceSnap',
		};
	}

	/**
	 * Obtiene el subject del template si está definido en el contexto
	 */
	getSubject ( template: string, context: EmailTemplateContext ): string | undefined {
		// Puedes definir subjects por defecto aquí
		const defaultSubjects: Record<string, string> = {
			'price-alert': '🚨 Alerta de Cambio de Precio',
			'welcome': '¡Bienvenido a PriceSnap!',
			'test': 'Email de Prueba - PriceSnap',
		};

		return context.subject || defaultSubjects[ template ];
	}
}

