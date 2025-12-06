import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {

  @ApiProperty( {
    description: 'Código de verificación 2FA',
    example: '123456',
    minLength: 6,
    maxLength: 6
  } )
  @IsString()
  @IsNotEmpty()
  @Length( 6, 6 )
  readonly token: string;

}

