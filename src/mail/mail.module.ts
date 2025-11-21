import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { AuthModule } from '../auth/auth.module';

@Module( {
	imports: [ ConfigModule, AuthModule ],
	controllers: [ MailController ],
	providers: [ MailService ],
	exports: [ MailService ]
} )
export class MailModule { }

