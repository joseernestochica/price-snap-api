import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum EmailLogStatus {
	PENDING = 'pending',
	SENT = 'sent',
	FAILED = 'failed',
}

@Entity( 'email_logs' )
export class EmailLog {
	@PrimaryGeneratedColumn( 'uuid' )
	id: string;

	@Column( 'text' )
	@Index()
	to: string;

	@Column( 'text' )
	from: string;

	@Column( 'text' )
	subject: string;

	@Column( 'text', { nullable: true } )
	template: string;

	@Column( 'text', { nullable: true } )
	html: string;

	@Column( 'text', { nullable: true } )
	context: string; // JSON stringificado del contexto del template

	@Column( {
		type: 'enum',
		enum: EmailLogStatus,
		default: EmailLogStatus.PENDING,
	} )
	@Index()
	status: EmailLogStatus;

	@Column( 'text', { nullable: true } )
	error: string;

	@Column( { type: 'timestamptz', nullable: true } )
	sentAt: Date;

	@Column( 'int', { default: 0 } )
	attempts: number;

	@Column( 'text', { nullable: true } )
	jobId: string; // ID del job de BullMQ si aplica

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}

