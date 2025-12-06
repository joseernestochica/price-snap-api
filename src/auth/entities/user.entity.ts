import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { UserImage } from './user-image.entity';
import * as bcrypt from 'bcrypt';

@Entity( 'users' )
export class User {
	@PrimaryGeneratedColumn( 'uuid' )
	id: string;

	@Column( 'text', { unique: true } )
	email: string;

	@Column( 'text' )
	password: string;

	@Column( 'text' )
	fullName: string;

	@Column( 'text', { nullable: true } )
	phone: string;

	@Column( 'text', { nullable: true } )
	address: string;

	@Column( 'text', { nullable: true } )
	postalCode: string;

	@Column( 'text', { nullable: true } )
	city: string;

	@Column( 'text', { nullable: true } )
	province: string;

	@Column( 'text', { nullable: true } )
	country: string;

	@Column( 'text', { nullable: true } )
	nif: string;

	@Column( 'bool', { default: true } )
	isActive: boolean;

	@Column( 'bool', { default: false } )
	isDeleted: boolean;

	@Column( 'bool', { default: false } )
	isTwoFactorEnabled: boolean;

	@Column( 'text', { nullable: true } )
	twoFactorSecret: string | null;

	@Column( 'text', { array: true, default: [ 'user' ] } )
	roles: string[];

	@Column( 'text', { nullable: true } )
	resetPasswordKey: string;

	@Column( { type: 'timestamptz', nullable: true } )
	resetPasswordExpires: Date;

	@Column( 'text', { nullable: true } )
	googleId: string;

	@Column( 'text', { nullable: true } )
	facebookId: string;

	@Column( 'bool', { default: false } )
	isEmailVerified: boolean;

	@Column( 'text', { nullable: true } )
	emailVerificationToken: string;

	@Column( 'timestamp', { nullable: true } )
	lastLoginAt: Date;

	@Column( 'text', { nullable: true } )
	lastLoginIp: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@OneToMany( () => RefreshToken, refreshToken => refreshToken.user )
	refreshTokens: RefreshToken[];

	@OneToMany( () => UserImage, ( userImage ) => userImage.user, { cascade: true, eager: true } )
	images: UserImage[];

	@BeforeInsert()
	@BeforeUpdate()
	emailToLowerCase () {
		this.email = this.email.toLowerCase().trim();
	}

	@BeforeInsert()
	@BeforeUpdate()
	async hashPassword () {
		if ( this.password && !this.password.startsWith( '$2b$' ) ) {
			this.password = await bcrypt.hash( this.password, 10 );
		}
	}

	async validatePassword ( password: string ): Promise<boolean> {
		return bcrypt.compare( password, this.password );
	}
}