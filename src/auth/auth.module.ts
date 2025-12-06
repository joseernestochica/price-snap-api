import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { GoogleController } from './google.controller';
import { TwoFactorController } from './two-factor.controller';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { TwoFactorService } from './two-factor.service';
import { JwtStrategy } from './strategies';
import { UserRoleGuard } from './guards';
import { User, RefreshToken } from './entities';
import { CommonModule } from 'src/common/common.module';

@Module( {
	controllers: [ AuthController, GoogleController, TwoFactorController ],
	providers: [ AuthService, GoogleService, TwoFactorService, JwtStrategy, UserRoleGuard ],
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature( [ User, RefreshToken ] ),
		PassportModule.register( {
			defaultStrategy: 'jwt',
		} ),
		JwtModule.registerAsync( {
			imports: [ ConfigModule ],
			inject: [ ConfigService ],
			useFactory: ( configService: ConfigService ) => ( {
				secret: configService.get( 'JWT_SECRET' ),
				signOptions: { expiresIn: configService.get( 'JWT_EXPIRES_IN' ) },
			} ),
		} ),
		CommonModule,
	],
	exports: [
		TypeOrmModule,
		JwtStrategy,
		PassportModule,
		JwtModule,
		AuthService,
	],
} )
export class AuthModule { }
