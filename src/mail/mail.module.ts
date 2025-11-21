import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailTemplateService } from './mail-template.service';
import { MailController } from './mail.controller';
import { AuthModule } from '../auth/auth.module';

@Module( {
	imports: [ ConfigModule, AuthModule ],
	controllers: [ MailController ],
	providers: [ MailService, MailTemplateService ],
	exports: [ MailService, MailTemplateService ]
} )
export class MailModule { }

