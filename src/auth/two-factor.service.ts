import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { GetResponse } from 'src/common/interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { EncryptService } from 'src/common/services';

@Injectable()
export class TwoFactorService {

	constructor (
		@InjectRepository( User )
		private readonly userRepository: Repository<User>,
		private readonly encryptService: EncryptService
	) { }

	// Genera un secreto y un QR para el usuario
	async generateSecret ( email: string ): Promise<GetResponse<any>> {

		const secret = speakeasy.generateSecret( {
			name: `PriceSnap (${ email })`,
			length: 20
		} );

		const otpauthUrl = secret.otpauth_url;
		const qrCodeDataURL = await qrcode.toDataURL( otpauthUrl );

		return {
			data: {
				secret: secret.base32,
				otpauthUrl,
				qrCodeDataURL
			},
			message: 'Secret generated successfully',
			statusCode: 200
		};

	}

	// Verifica el código 2FA introducido por el usuario
	verifyCode ( encryptedSecret: string | null | undefined, token: string ): boolean {

		if ( !encryptedSecret ) {
			return false;
		}

		const secret = this.encryptService.decrypt( encryptedSecret );

		return speakeasy.totp.verify( {
			secret,
			encoding: 'base32',
			token,
			window: 1
		} );

	}

	// Guarda el secreto en la base de datos (sin activar el 2FA todavía)
	async saveSecret2FA ( userId: string, secret: string ): Promise<void> {

		const encryptedSecret = this.encryptService.encrypt( secret );

		await this.userRepository.update( userId, {
			twoFactorSecret: encryptedSecret
		} );

	}

	// Activa o desactiva el 2FA (sin modificar el secreto)
	async set2faStatus ( userId: string, enabled: boolean ): Promise<GetResponse<any>> {

		await this.userRepository.update( userId, { isTwoFactorEnabled: enabled } );

		return {
			data: { isTwoFactorEnabled: enabled },
			message: enabled ? '2FA activado' : '2FA desactivado',
			statusCode: 200
		};

	}

	// Desactiva el 2FA validando el código y eliminando el secreto
	async disable2fa ( user: User, token: string ): Promise<{ success: boolean; message: string }> {

		if ( !user.twoFactorSecret ) {
			return { success: false, message: '2fa_disabled' };
		}

		const isValid = this.verifyCode( user.twoFactorSecret, token );
		if ( !isValid ) {
			return { success: false, message: 'Código de verificación 2FA incorrecto' };
		}

		await this.userRepository.update( user.id, { isTwoFactorEnabled: false, twoFactorSecret: undefined } );
		return { success: true, message: '2FA desactivado' };

	}

	// Verifica si el usuario tiene 2FA habilitado
	async is2FAEnabled ( userId: string ): Promise<boolean> {

		const user = await this.userRepository.findOne( {
			where: { id: userId },
			select: [ 'isTwoFactorEnabled' ]
		} );

		return user?.isTwoFactorEnabled || false;

	}

}
