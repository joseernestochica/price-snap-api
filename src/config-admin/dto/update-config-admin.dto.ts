import { PartialType } from '@nestjs/mapped-types';
import { CreateConfigAdminDto } from './create-config-admin.dto';

export class UpdateConfigAdminDto extends PartialType( CreateConfigAdminDto ) { }







