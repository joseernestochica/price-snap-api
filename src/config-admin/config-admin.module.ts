import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigAdminService } from './config-admin.service';
import { ConfigAdminController } from './config-admin.controller';
import { ConfigAdmin } from './entities';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ ConfigAdmin ] ),
    AuthModule,
    CommonModule,
  ],
  providers: [ ConfigAdminService ],
  controllers: [ ConfigAdminController ],
  exports: [ ConfigAdminService ],
} )
export class ConfigAdminModule { }







