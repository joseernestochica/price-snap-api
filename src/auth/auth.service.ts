import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, MoreThan } from 'typeorm';

import { createQueryBuilder, Utils } from 'src/common/helpers';
import { CreateUserDto, LoginUserDto, UpdateRefreshTokenDto, UpdateUserDto } from './dto';
import { GetParams, GetResponse } from 'src/common/interfaces';
import { GetByIdsDto, GetParamsDto } from 'src/common/dto';
import { HandleErrorService } from 'src/common/services';
import { JwtPayload } from './interfaces';
import { ValidRoles } from './interfaces';
import { RefreshToken, User } from './entities';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {

	constructor (

		@InjectRepository( RefreshToken )
		private readonly refreshTokenRepository: Repository<RefreshToken>,

		@InjectRepository( User )
		private readonly userRepository: Repository<User>,
		private readonly handleErrorService: HandleErrorService,
		private readonly jwtService: JwtService,
		private readonly twoFactorService: TwoFactorService,
		private readonly configService: ConfigService

	) { }

	private getJwtToken ( payload: JwtPayload ): string {

		return this.jwtService.sign( payload );

	}

	private async createRefreshToken ( user: User, ip: string ): Promise<string> {

		try {

			await this.refreshTokenRepository.delete( { user: user } );
			const refreshTokenUid = uuidv4();

			const refreshTokenBody: RefreshToken = {
				user: user,
				token: refreshTokenUid,
				created: new Date(),
				expires: new Date( Date.now() + 7 * 24 * 60 * 60 * 1000 ),
				ip
			};

			const refreshToken = this.refreshTokenRepository.create( refreshTokenBody as Object );

			await this.refreshTokenRepository.save( refreshToken );
			return refreshTokenUid;

		} catch ( error ) {
			this.handleErrorService.handleDBException( error );
			return ''; // This will never be reached due to handleDBException throwing
		}

	}

	async create ( createUserDto: CreateUserDto ): Promise<GetResponse<User>> {

		try {

			// Verificar si el email ya existe (más eficiente con count)
			const emailCount = await this.userRepository.count( {
				where: { email: createUserDto.email.toLowerCase().trim() }
			} );

			if ( emailCount > 0 ) {
				this.handleErrorService.handleBadRequestException( 'email-already-exists' );
			}

			const user = this.userRepository.create( createUserDto );
			await this.userRepository.save( user );

			delete ( user as any ).password;

			return {
				data: user,
				token: this.getJwtToken( {
					id: user.id,
					email: user.email,
					fullName: user.fullName,
					role: user.roles[ 0 ],
					isTwoFactorEnabled: user.isTwoFactorEnabled
				} ),
				message: 'User created successfully',
				statusCode: 201
			};

		}
		catch ( error ) {
			if ( error instanceof HttpException ) {
				throw error;
			}
			this.handleErrorService.handleDBException( error );
			return {} as GetResponse<User>; // This will never be reached due to handleDBException throwing
		}

	}

	async findAll ( getParamsDto: GetParamsDto ): Promise<GetResponse<User>> {

		const getParams: GetParams = {};
		getParams.page = getParamsDto.page || 1;
		getParams.limit = getParamsDto.limit || 10;
		getParams.sort = { column: getParamsDto.sortColumn || 'id', direction: getParamsDto.sortDirection || 'DESC' };
		getParams.select = getParamsDto.select && getParamsDto.select !== '' ? getParamsDto.select.split( '|' ) : [];
		getParams.search = getParamsDto.search && getParamsDto.search.trim() !== '' ? getParamsDto.search.trim() : undefined;
		getParams.relations = [ 'images' ];

		if ( getParams.search ) {
			getParams.where = {
				query: `user.isDeleted = false 
          AND (user.fullName ILIKE :s OR user.email ILIKE :s OR user.phone ILIKE :s OR user.postalCode ILIKE :s OR user.nif ILIKE :s)`,
				params: {
					s: `%${ getParams.search }%`,
				}
			};
		}

		// Mostrar solo los usuarios que no estén eliminados
		getParams.andWhere = [ {
			field: 'isDeleted',
			value: false
		} ];

		if ( getParamsDto.sgStr1 && getParamsDto.sgStr1.trim() !== '' ) {
			getParams.andWhere.push( { field: 'email', value: getParamsDto.sgStr1.trim() } );
		}
		if ( getParamsDto.sgStr2 && getParamsDto.sgStr2.trim() !== '' ) {
			getParams.andWhere.push( { field: 'fullName', value: getParamsDto.sgStr2.trim() } );
		}
		if ( getParamsDto.sgInt1 ) {
			getParams.andWhere.push( { field: 'isActive', value: getParamsDto.sgInt1 === 1 ? true : false } );
		}

		const getResponse = await createQueryBuilder<User>( this.userRepository, getParams, 'user' );
		if ( !getResponse ) {
			this.handleErrorService.handleNotFoundException( 'Error al obtener los usuarios' );
		}

		( getResponse.data as User[] ).forEach( user => delete ( user as any ).password );

		getResponse.message = 'Users list';
		getResponse.statusCode = 200;

		return getResponse;

	}

	async findOne ( id: string ): Promise<GetResponse<User>> {

		const user = await this.userRepository.findOne( {
			where: { id },
			relations: [ 'images' ]
		} );

		if ( !user ) {
			this.handleErrorService.handleNotFoundException( 'User not found' );
		}

		return {
			data: user!,
			message: 'User found',
			statusCode: 200
		};

	}

	async findByIds ( dto: GetByIdsDto ): Promise<GetResponse<User>> {

		try {

			const ids = Array.from( new Set( ( dto.ids || [] ).filter( v => !!v ) ) );
			if ( ids.length === 0 ) {
				this.handleErrorService.handleBadRequestException( 'ids-required' );
			}

			const users = await this.userRepository.find( {
				where: ids.map( id => ( { id } ) ),
				select: dto.select && dto.select.trim() !== '' ? ( dto.select.split( '|' ) as ( keyof User )[] ) : undefined
			} as any );

			users.forEach( user => delete ( user as any ).password );

			return {
				data: users,
				message: 'Users found by ids',
				statusCode: 200
			};

		} catch ( error ) {
			if ( error instanceof HttpException ) {
				throw error;
			}
			this.handleErrorService.handleDBException( error );
			return {} as GetResponse<User>; // This will never be reached due to handleDBException throwing
		}

	}

	async login ( loginUserDto: LoginUserDto, ip?: string, isHashed = false, hasCheck2fa = true ): Promise<GetResponse<User>> {

		const { email, password, token2fa } = loginUserDto;

		const user = await this.userRepository.findOne( {
			where: { email, isDeleted: false },
			select: [ 'id', 'email', 'fullName', 'roles', 'password', 'isTwoFactorEnabled', 'twoFactorSecret' ]
		} );

		if ( !user ) {
			this.handleErrorService.handleUnauthorizedException( 'User not found (email)' );
		}

		if ( !isHashed ) {
			if ( !bcrypt.compareSync( password, user!.password ) ) {
				this.handleErrorService.handleUnauthorizedException( 'Invalid password' );
			}
		} else {
			if ( password !== user!.password ) {
				this.handleErrorService.handleUnauthorizedException( 'Invalid password' );
			}
		}

		// Lógica 2FA
		if ( user!.isTwoFactorEnabled && hasCheck2fa ) {
			if ( !token2fa ) {
				this.handleErrorService.handleBadRequestException( '2fa_required' );
			}

			const isValid2fa = this.twoFactorService.verifyCode( user!.twoFactorSecret!, token2fa! );
			if ( !isValid2fa ) {
				this.handleErrorService.handleBadRequestException( '2fa_invalid' );
			}
		}

		const refreshTokenUid = await this.createRefreshToken( user!, ip || '127.0.0.1' );
		delete ( user as any ).password;
		delete ( user as any ).twoFactorSecret;
		delete ( user as any ).isTwoFactorEnabled;

		return {
			data: user!,
			token: this.getJwtToken( {
				id: user!.id,
				email: user!.email,
				fullName: user!.fullName,
				role: user!.roles[ 0 ],
				isTwoFactorEnabled: user!.isTwoFactorEnabled
			} ),
			refreshToken: refreshTokenUid,
			message: 'Login successful',
			statusCode: 200
		};

	}

	async generateTokensForUser ( user: User, ip?: string ): Promise<{ token: string; refreshToken: string }> {
		const refreshTokenUid = await this.createRefreshToken( user, ip || '127.0.0.1' );
		
		const token = this.getJwtToken( {
			id: user.id,
			email: user.email,
			fullName: user.fullName,
			role: user.roles[ 0 ] || 'user',
			isTwoFactorEnabled: user.isTwoFactorEnabled || false,
		} );

		return {
			token,
			refreshToken: refreshTokenUid,
		};
	}

	async checkAuthStatus ( user: User ): Promise<GetResponse<User>> {

		delete ( user as any ).password;
		delete ( user as any ).isDeleted;
		delete ( user as any ).isActive;
		delete ( user as any ).createdAt;
		delete ( user as any ).updatedAt;
		delete ( user as any ).twoFactorSecret;
		delete ( user as any ).isTwoFactorEnabled;
		delete ( user as any ).resetPasswordKey;

		return {
			data: user,
			token: this.getJwtToken( {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				role: user.roles[ 0 ],
				isTwoFactorEnabled: user.isTwoFactorEnabled
			} ),
			message: 'User authenticated',
			statusCode: 200
		};

	}

	async refreshToken ( updateTokenDto: UpdateRefreshTokenDto ): Promise<GetResponse<User>> {

		const { refreshToken, userId, ip } = updateTokenDto;

		const userDb = await this.findOne( userId! );

		const count = await this.refreshTokenRepository.count(
			{
				where: {
					user: { id: userId },
					token: refreshToken,
					expires: MoreThan( new Date() )
				}
			}
		);

		if ( count === 0 ) {
			this.handleErrorService.handleBadRequestException( 'Invalid token' );
		}

		return await this.login( userDb.data as LoginUserDto, ip, true, false );

	}

	async update ( id: string, updateUserDto: UpdateUserDto ): Promise<GetResponse<User>> {
		try {

			// Buscar el usuario
			const user = ( await this.findOne( id ) ).data as User;

			if ( !user )
				throw new NotFoundException( `Usuario con ID ${ id } no encontrado` );

			if ( updateUserDto.password ) {
				updateUserDto.password = bcrypt.hashSync( updateUserDto.password, 10 );
			}

			// Actualizar el usuario
			const updatedUser = await this.userRepository.preload( {
				id,
				...updateUserDto
			} );

			// Guardar los cambios
			await this.userRepository.save( updatedUser! );

			// Eliminar la contraseña del objeto de respuesta
			delete ( updatedUser as any ).password;

			return {
				data: updatedUser,
				message: 'Usuario actualizado correctamente',
				statusCode: 200
			};

		} catch ( error ) {
			this.handleErrorService.handleDBException( error );
			return {} as GetResponse<User>; // This will never be reached due to handleDBException throwing
		}
	}

	async deleteRefreshToken ( id: string, token: string ): Promise<GetResponse<any>> {

		try {

			await this.refreshTokenRepository.delete( { user: { id }, token } );

			return {
				message: 'Refresh token deleted',
				statusCode: 200
			};

		} catch ( error ) {
			this.handleErrorService.handleDBException( error );
			return {} as GetResponse<User>; // This will never be reached due to handleDBException throwing
		}

	}

	async deleteUserSoft ( id: string ): Promise<GetResponse<User>> {
		try {

			const user = ( await this.findOne( id ) ).data as User;

			if ( !user )
				throw new NotFoundException( `Usuario con ID ${ id } no encontrado` );

			const deactivatedUser = await this.userRepository.preload( {
				id,
				isDeleted: true,
				isActive: false,
				email: `${ user.email }|@|${ Date.now() }@deleted.com`
			} );

			await this.userRepository.save( deactivatedUser! );

			delete ( deactivatedUser as any ).password;

			return {
				data: deactivatedUser,
				message: 'Usuario desactivado correctamente',
				statusCode: 200
			};

		} catch ( error ) {
			this.handleErrorService.handleDBException( error );
			return {} as GetResponse<User>; // This will never be reached due to handleDBException throwing
		}
	}

	async deleteUserHard ( id: string ): Promise<GetResponse<User>> {
		try {

			const user = ( await this.findOne( id ) ).data as User;

			if ( !user ) {
				throw new NotFoundException( `Usuario con ID ${ id } no encontrado` );
			}

			// Eliminar el usuario definitivamente
			await this.userRepository.remove( user );

			return {
				data: user,
				message: 'Usuario eliminado permanentemente',
				statusCode: 200
			};

		} catch ( error ) {
			this.handleErrorService.handleDBException( error );
			return {} as GetResponse<User>; // This will never be reached due to handleDBException throwing
		}
	}

}