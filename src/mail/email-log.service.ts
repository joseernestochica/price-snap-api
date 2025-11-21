import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog, EmailLogStatus } from './entities/email-log.entity';
import { createQueryBuilder } from 'src/common/helpers';
import { GetParams, GetResponse } from 'src/common/interfaces';
import { HandleErrorService } from 'src/common/services';

@Injectable()
export class EmailLogService {
	private readonly logger = new Logger( EmailLogService.name );

	constructor (
		@InjectRepository( EmailLog )
		private readonly emailLogRepository: Repository<EmailLog>,
		private readonly handleErrorService: HandleErrorService,
		private readonly configService: ConfigService,
	) { }

	async createLog ( data: {
		to: string;
		from?: string;
		subject: string;
		template?: string;
		html?: string;
		context?: any;
		jobId?: string;
	} ): Promise<EmailLog> {
		try {
			this.logger.log( `Intentando crear log para email a ${ data.to }` );
			const defaultFrom = data.from || this.configService.get<string>( 'SMTP_FROM' ) || this.configService.get<string>( 'SMTP_USER' ) || 'no-reply@example.com';
			const log = this.emailLogRepository.create( {
				to: data.to,
				from: defaultFrom,
				subject: data.subject,
				template: data.template || null,
				html: data.html || null,
				context: data.context ? JSON.stringify( data.context ) : null,
				status: EmailLogStatus.PENDING,
				jobId: data.jobId || null,
				attempts: 0,
			} as Partial<EmailLog> );

			const savedLog = await this.emailLogRepository.save( log );
			this.logger.log( `Log creado exitosamente para email a ${ data.to } con ID ${ savedLog.id }` );
			return savedLog;
		} catch ( error ) {
			this.logger.error( `Error creando log: ${ error.message }`, error.stack );
			this.logger.error( `Error completo: ${ JSON.stringify( error ) }` );
			// No usar handleDBException aquí porque puede lanzar una excepción HTTP
			// que interrumpiría el flujo del email
			throw error;
		}
	}

	async updateLogSuccess ( logId: string ): Promise<void> {
		try {
			await this.emailLogRepository.update( logId, {
				status: EmailLogStatus.SENT,
				sentAt: new Date(),
			} );
			this.logger.log( `Log ${ logId } actualizado como enviado exitosamente` );
		} catch ( error ) {
			this.logger.error( `Error actualizando log ${ logId }: ${ error.message }`, error.stack );
			throw error;
		}
	}

	async updateLogFailure ( logId: string, error: string, attempts?: number ): Promise<void> {
		try {
			const updateData: Partial<EmailLog> = {
				status: EmailLogStatus.FAILED,
				error: error.substring( 0, 1000 ), // Limitar tamaño del error
			};

			if ( attempts !== undefined ) {
				updateData.attempts = attempts;
			} else {
				const log = await this.emailLogRepository.findOne( { where: { id: logId } } );
				if ( log ) {
					updateData.attempts = log.attempts + 1;
				}
			}

			await this.emailLogRepository.update( logId, updateData );
			this.logger.warn( `Log ${ logId } actualizado como fallido: ${ error.substring( 0, 100 ) }` );
		} catch ( error ) {
			this.logger.error( `Error actualizando log ${ logId }: ${ error.message }`, error.stack );
			throw error;
		}
	}

	async incrementAttempts ( logId: string ): Promise<void> {
		try {
			const log = await this.emailLogRepository.findOne( { where: { id: logId } } );
			if ( log ) {
				await this.emailLogRepository.update( logId, {
					attempts: log.attempts + 1,
				} );
			}
		} catch ( error ) {
			this.logger.error( `Error incrementando intentos para log ${ logId }: ${ error.message }` );
		}
	}

	async findAll ( dto: {
		page?: number;
		limit?: number;
		email?: string;
		status?: EmailLogStatus;
		template?: string;
		sortColumn?: string;
		sortDirection?: 'ASC' | 'DESC';
	} ): Promise<GetResponse<EmailLog>> {
		const getParams: GetParams = {
			page: dto.page || 1,
			limit: dto.limit || 10,
			sort: {
				column: dto.sortColumn || 'createdAt',
				direction: dto.sortDirection || 'DESC',
			},
		};

		if ( dto.email ) {
			getParams.andWhere = [
				...getParams.andWhere || [],
				{ field: 'to', value: dto.email },
			];
		}

		if ( dto.status ) {
			getParams.andWhere = [
				...getParams.andWhere || [],
				{ field: 'status', value: dto.status, isEnum: true },
			];
		}

		if ( dto.template ) {
			getParams.andWhere = [
				...getParams.andWhere || [],
				{ field: 'template', value: dto.template },
			];
		}

		return await createQueryBuilder( this.emailLogRepository, getParams, 'emailLog' );
	}

	async findById ( id: string ): Promise<EmailLog> {
		const log = await this.emailLogRepository.findOne( { where: { id } } );
		if ( !log ) {
			this.handleErrorService.handleNotFoundException( `Email log con ID ${ id } no encontrado` );
		}
		return log!;
	}

	async findByEmail ( email: string, limit: number = 50 ): Promise<EmailLog[]> {
		return await this.emailLogRepository.find( {
			where: { to: email },
			order: { createdAt: 'DESC' },
			take: limit,
		} );
	}
}

