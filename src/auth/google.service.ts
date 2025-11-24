import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, LoginUserDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities';
import * as crypto from 'crypto';

@Injectable()
export class GoogleService {
	constructor (
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
		@InjectRepository( User ) private readonly userRepository: Repository<User>,
	) { }

	private clientId: string;
	private clientSecret: string;
	private redirectUri: string;

	private initializeConfig () {
		this.clientId = this.configService.get<string>( 'OAUTH_GOOGLE_CLIENT_ID' ) || '';
		this.clientSecret = this.configService.get<string>( 'OAUTH_GOOGLE_CLIENT_SECRET' ) || '';
		this.redirectUri = this.configService.get<string>( 'OAUTH_GOOGLE_REDIRECT_URI' ) || '';
	}

	private generateRandomUrlSafe ( bytes = 32 ): string {
		return crypto.randomBytes( bytes ).toString( 'base64' )
			.replace( /\+/g, '-' )
			.replace( /\//g, '_' )
			.replace( /=+$/, '' );
	}

	private parseCookies ( cookieHeader?: string ): Record<string, string> {
		const cookies: Record<string, string> = {};
		if ( !cookieHeader ) return cookies;

		cookieHeader.split( ';' ).forEach( ( cookie ) => {
			const [ name, ...rest ] = cookie.split( '=' );
			const key = name?.trim();
			const value = rest.join( '=' ).trim();
			if ( key ) cookies[ key ] = decodeURIComponent( value );
		} );

		return cookies;
	}

	async start ( appRedirect: string, res: any ) {
		this.initializeConfig();

		// Validar configuración
		if ( !this.clientId || !this.clientSecret || !this.redirectUri ) {
			return res.status( 500 ).json( {
				message: 'Google OAuth not configured. Please check OAUTH_GOOGLE_CLIENT_ID, OAUTH_GOOGLE_CLIENT_SECRET, and OAUTH_GOOGLE_REDIRECT_URI environment variables',
				statusCode: 500,
			} );
		}

		const state = this.generateRandomUrlSafe( 24 );
		const codeVerifier = this.generateRandomUrlSafe( 64 );

		// Generar code_challenge usando SHA256 del code_verifier (PKCE)
		const codeChallenge = crypto
			.createHash( 'sha256' )
			.update( codeVerifier )
			.digest( 'base64' )
			.replace( /\+/g, '-' )
			.replace( /\//g, '_' )
			.replace( /=+$/, '' );

		const cookieBase = {
			httpOnly: true,
			maxAge: 5 * 60 * 1000,
			path: '/api/auth/google',
		} as any;

		const nodeEnv = this.configService.get<string>( 'NODE_ENV' ) || 'development';
		const isProd = nodeEnv === 'production';
		const cookieOptions = {
			...cookieBase,
			secure: isProd,
			sameSite: isProd ? 'none' : 'lax',
		} as any;

		res.cookie( 'g_state', state, cookieOptions );
		res.cookie( 'g_verifier', codeVerifier, cookieOptions );
		if ( appRedirect ) res.cookie( 'g_appredir', appRedirect, cookieOptions );

		// Build Google OAuth URL manually
		const params = new URLSearchParams( {
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope: 'openid email profile',
			state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
			response_type: 'code',
			access_type: 'offline',
		} );

		const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${ params.toString() }`;

		// Log para debug (solo en desarrollo)
		if ( nodeEnv === 'development' ) {
			console.log( '🔐 Google OAuth Configuration:' );
			console.log( '  - Client ID:', this.clientId.substring( 0, 20 ) + '...' );
			console.log( '  - Redirect URI:', this.redirectUri );
			console.log( '  - Authorization URL:', authorizationUrl.substring( 0, 100 ) + '...' );
		}

		return res.redirect( authorizationUrl );
	}

	async callback ( req: any, res: any ) {
		this.initializeConfig();

		const cookies = this.parseCookies( req.headers?.cookie );
		const expectedState = cookies[ 'g_state' ];
		const codeVerifier = cookies[ 'g_verifier' ];
		const appRedirect = cookies[ 'g_appredir' ];

		const { code, state, error, error_description } = req.query || {};

		if ( error ) {
			const redirectUrl = appRedirect || '/';
			return res.redirect( `${ redirectUrl }?error=${ encodeURIComponent( error_description || error ) }` );
		}

		if ( !code || !state || !expectedState || state !== expectedState || !codeVerifier ) {
			return res.status( 400 ).json( { message: 'Invalid OAuth state' } );
		}

		// Exchange code for token
		let tokenResponse: any;
		try {
			const tokenParams = new URLSearchParams( {
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
				grant_type: 'authorization_code',
				redirect_uri: this.redirectUri,
				code_verifier: codeVerifier,
			} );

			const tokenRes = await fetch( 'https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: tokenParams.toString(),
			} );

			tokenResponse = await tokenRes.json();

			if ( !tokenRes.ok ) {
				throw new Error( tokenResponse.error_description || 'Token exchange failed' );
			}
		} catch ( err ) {
			const nodeEnv = this.configService.get<string>( 'NODE_ENV' ) || 'development';
			if ( nodeEnv !== 'production' ) {
				return res.status( 400 ).json( {
					message: 'Token exchange failed',
					error: ( err as any )?.message || err,
				} );
			}
			return res.status( 400 ).json( { message: 'Token exchange failed' } );
		}

		// Get user info
		let profile: any = {};
		try {
			const userInfoRes = await fetch( 'https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: {
					Authorization: `Bearer ${ tokenResponse.access_token }`,
				},
			} );

			if ( userInfoRes.ok ) {
				profile = await userInfoRes.json();
			}
		} catch ( _e ) {
			// Fallback - try to decode ID token if available
			if ( tokenResponse.id_token ) {
				try {
					const payload = JSON.parse( Buffer.from( tokenResponse.id_token.split( '.' )[ 1 ], 'base64' ).toString() );
					profile = payload;
				} catch ( _e2 ) {
					// Ignore
				}
			}
		}

		const email = ( profile?.email || '' ).toLowerCase();
		const fullName = profile?.name || profile?.given_name || 'Google User';

		if ( !email ) {
			return res.status( 400 ).json( { message: 'Email not provided by Google' } );
		}

		let user = await this.userRepository.findOne( { where: { email } } );
		if ( !user ) {
			const randomPassword = this.generateRandomUrlSafe( 32 );
			const toCreate: CreateUserDto = {
				email,
				password: randomPassword,
				fullName,
			} as any;
			const createdUser = await this.authService.create( toCreate );
			user = createdUser.data as User;
		}

		// Update Google ID if not set
		if ( !user!.googleId ) {
			user!.googleId = profile.sub || profile.id;
			await this.userRepository.save( user! );
		}

		// Generar tokens directamente sin validar contraseña (usuario ya autenticado por Google)
		const tokens = await this.authService.generateTokensForUser( user!, req.ip || '127.0.0.1' );

		res.clearCookie( 'g_state' );
		res.clearCookie( 'g_verifier' );
		res.clearCookie( 'g_appredir' );

		const redirectUrl = appRedirect || '/';

		const nodeEnv = this.configService.get<string>( 'NODE_ENV' ) || 'development';
		const isProd = nodeEnv === 'production';

		// Establecer cookies HttpOnly
		// En desarrollo, usar sameSite: 'lax' y secure: false para que funcionen con localhost
		// En producción, usar sameSite: 'none' y secure: true para cross-origin
		const cookieOpts = {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? 'none' : 'lax',
			path: '/',
			domain: isProd ? undefined : undefined, // No especificar domain en desarrollo para localhost
			maxAge: 15 * 60 * 1000,
		} as any;

		res.cookie( 'access_token', tokens.token, cookieOpts );
		res.cookie( 'refresh_token', tokens.refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 } );

		// Log para debug (solo en desarrollo)
		if ( nodeEnv === 'development' ) {
			console.log( '✅ Google OAuth Success:' );
			console.log( '  - User:', user!.email );
			console.log( '  - Redirect URL:', redirectUrl );
			console.log( '  - Cookies establecidas: access_token, refresh_token' );
		}

		// Si el redirectUrl incluye parámetros, agregar los tokens como query params también (fallback)
		// Esto es útil si las cookies no funcionan
		const separator = redirectUrl.includes( '?' ) ? '&' : '?';
		const redirectWithTokens = `${ redirectUrl }${ separator }token=${ tokens.token }&refreshToken=${ tokens.refreshToken }`;

		return res.redirect( redirectWithTokens );
	}
}