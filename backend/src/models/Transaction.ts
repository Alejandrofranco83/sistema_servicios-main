import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';
import { CashRegister } from './CashRegister';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    branchId!: string;

    @ManyToOne(() => CashRegister)
    @JoinColumn({ name: 'cashRegisterId' })
    cashRegister!: CashRegister;

    @Column()
    cashRegisterId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: string;

    @Column({
        type: 'enum',
        enum: ['AQUI_PAGO', 'PAGO_EXPRESS', 'WESTERN_UNION', 'TIGO', 'PERSONAL', 'CLARO'],
        default: 'AQUI_PAGO'
    })
    platform!: string;

    @Column({
        type: 'enum',
        enum: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'RECHARGE'],
        default: 'PAYMENT'
    })
    type!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    commission!: number;

    @Column({ nullable: true })
    referenceNumber!: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: {
        customerName?: string;
        customerPhone?: string;
        serviceType?: string;
        notes?: string;
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async transformToUpperCase() {
        this.branchId = this.branchId.toUpperCase();
        if (this.referenceNumber) {
            this.referenceNumber = this.referenceNumber.toUpperCase();
        }
        if (this.metadata?.customerName) {
            this.metadata.customerName = this.metadata.customerName.toUpperCase();
        }
    }
} 