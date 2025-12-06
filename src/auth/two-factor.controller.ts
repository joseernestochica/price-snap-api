import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TwoFactorService } from './two-factor.service';
import { User } from './entities/user.entity';
import { GetUser } from './decorators/get-user.decorator';
import { GetResponse } from 'src/common/interfaces';
import { Verify2FADto, Disable2FADto } from './dto';
import { Auth } from './decorators';

@ApiTags( 'Auth' )
@Controller( 'auth/2fa' )
export class TwoFactorController {

	constructor ( private readonly twoFactorService: TwoFactorService ) { }

	// Endpoint para generar el secreto y el QR
	@Post( 'generate' )
	@Auth()
	@ApiOperation( { summary: 'Genera un secreto 2FA y código QR' } )
	@ApiResponse( { status: 200, description: 'Secreto generado exitosamente' } )
	async generate ( @GetUser() user: User ): Promise<GetResponse<any>> {

		const result = await this.twoFactorService.generateSecret( user.email );
		const secret = result.data.secret;

		await this.twoFactorService.saveSecret2FA( user.id, secret );

		return result;

	}

	// Endpoint para verificar el código 2FA
	@Post( 'verify' )
	@Auth()
	@ApiOperation( { summary: 'Verifica y activa el código 2FA' } )
	@ApiResponse( { status: 200, description: '2FA verificado y activado' } )
	@ApiResponse( { status: 400, description: 'Código de verificación 2FA incorrecto' } )
	async verify ( @GetUser() user: User, @Body() dto: Verify2FADto ): Promise<GetResponse<any>> {

		if ( !user.twoFactorSecret ) {
			return {
				data: {
					success: false,
					message: 'No se ha configurado un secreto 2FA. Por favor, genere uno primero.'
				},
				message: 'No se ha configurado un secreto 2FA. Por favor, genere uno primero.',
				statusCode: 400
			};
		}

		const isValid = this.twoFactorService.verifyCode( user.twoFactorSecret, dto.token );
		if ( isValid ) {
			await this.twoFactorService.set2faStatus( user.id, true );
			return {
				data: {
					success: true,
					message: '2FA verificado y activado'
				},
				message: '2FA verificado y activado',
				statusCode: 200
			};
		} else {
			return {
				data: {
					success: false,
					message: 'Código de verificación 2FA incorrecto'
				},
				message: 'Código de verificación 2FA incorrecto',
				statusCode: 400
			};
		}

	}

	@Post( 'disable' )
	@Auth()
	@ApiOperation( { summary: 'Desactiva el 2FA validando el código' } )
	@ApiResponse( { status: 200, description: '2FA desactivado exitosamente' } )
	@ApiResponse( { status: 400, description: 'Código de verificación 2FA incorrecto' } )
	async disable2fa ( @GetUser() user: User, @Body() dto: Disable2FADto ): Promise<GetResponse<any>> {

		const result = await this.twoFactorService.disable2fa( user, dto.token );

		return {
			data: {
				isTwoFactorEnabled: !result.success ? true : false,
				message: result.message
			},
			message: result.message,
			statusCode: result.success ? 200 : 400
		};

	}

	@Post( 'enabled' )
	@Auth()
	@ApiOperation( { summary: 'Activa el 2FA sin verificar código' } )
	@ApiResponse( { status: 200, description: '2FA activado' } )
	async enabled2fa ( @GetUser() user: User ): Promise<GetResponse<any>> {

		return await this.twoFactorService.set2faStatus( user.id, true );

	}

	// Endpoint para consultar si el usuario tiene activo el 2FA
	@Get( 'status' )
	@Auth()
	@ApiOperation( { summary: 'Consulta el estado del 2FA del usuario' } )
	@ApiResponse( { status: 200, description: 'Estado del 2FA' } )
	async get2faStatus ( @GetUser() user: User ): Promise<GetResponse<any>> {

		return {
			data: { isTwoFactorEnabled: !!user.isTwoFactorEnabled },
			message: 'Estado del 2FA',
			statusCode: 200
		};

	}

}

