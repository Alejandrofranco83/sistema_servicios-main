import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';

@Entity('cash_registers')
export class CashRegister {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    branchId!: string;

    @Column()
    registerNumber!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    initialBalance!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    currentBalance!: number;

    @Column({ type: 'enum', enum: ['OPEN', 'CLOSED'], default: 'CLOSED' })
    status!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ nullable: true })
    userId!: string;

    @Column({ type: 'timestamp', nullable: true })
    openedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    closedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: {
        closingNotes?: string;
        supervisor?: string;
        differences?: number;
    };

    @BeforeInsert()
    @BeforeUpdate()
    async transformToUpperCase() {
        this.branchId = this.branchId.toUpperCase();
        this.registerNumber = this.registerNumber.toUpperCase();
    }
} 