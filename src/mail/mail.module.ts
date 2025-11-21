import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailTemplateService } from './mail-template.service';
import { MailController } from './mail.controller';
import { EmailLogController } from './email-log.controller';
import { EmailLogService } from './email-log.service';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { MailQueue } from './queues/mail.queue';
import { MailProcessor } from './queues/mail.processor';
import { MAIL_QUEUE_NAME } from './queues/mail.queue';
import { EmailLog } from './entities/email-log.entity';

@Module( {
	imports: [
		ConfigModule,
		AuthModule,
		CommonModule,
		TypeOrmModule.forFeature( [ EmailLog ] ),
		BullModule.forRootAsync( {
			imports: [ ConfigModule ],
			inject: [ ConfigService ],
			useFactory: ( configService: ConfigService ) => ( {
				connection: {
					host: configService.get<string>( 'REDIS_HOST', 'localhost' ),
					port: configService.get<number>( 'REDIS_PORT', 6379 ),
					password: configService.get<string>( 'REDIS_PASSWORD' ) || undefined,
				},
			} ),
		} ),
		BullModule.registerQueue( {
			name: MAIL_QUEUE_NAME,
		} ),
	],
	controllers: [ MailController, EmailLogController ],
	providers: [ MailService, MailTemplateService, EmailLogService, MailQueue, MailProcessor ],
	exports: [ MailService, MailTemplateService, EmailLogService, MailQueue ]
} )
export class MailModule { }

