import { Controller, Get, Param, Query } from '@nestjs/common';
import { EmailLogService } from './email-log.service';
import { GetEmailLogsDto } from './dto/get-email-logs.dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { ParseUUIDPipe } from '@nestjs/common/pipes';

@Controller( 'mail/logs' )
export class EmailLogController {
	constructor ( private readonly emailLogService: EmailLogService ) { }

	@Get()
	@Auth( ValidRoles.admin )
	async findAll ( @Query() dto: GetEmailLogsDto ) {
		const result = await this.emailLogService.findAll( dto );
		return {
			ok: true,
			message: 'Email logs retrieved successfully',
			statusCode: 200,
			data: result.data,
			total: result.total,
			page: result.page,
			lastPage: result.lastPage,
		};
	}

	@Get( ':id' )
	@Auth( ValidRoles.admin )
	async findById ( @Param( 'id', ParseUUIDPipe ) id: string ) {
		const log = await this.emailLogService.findById( id );
		return {
			ok: true,
			message: 'Email log retrieved successfully',
			statusCode: 200,
			data: log,
		};
	}

	@Get( 'email/:email' )
	@Auth( ValidRoles.admin )
	async findByEmail ( @Param( 'email' ) email: string, @Query( 'limit' ) limit?: number ) {
		const logs = await this.emailLogService.findByEmail( email, limit ? Number( limit ) : 50 );
		return {
			ok: true,
			message: 'Email logs retrieved successfully',
			statusCode: 200,
			data: logs,
			count: logs.length,
		};
	}
}

