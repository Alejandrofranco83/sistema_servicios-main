import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { PrismaClient, Prisma } from '@prisma/client';
// import { hash } from 'bcryptjs'; // Comentado o eliminado
import bcrypt from 'bcryptjs';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column()
    fullName!: string;

    @Column()
    branchId!: string;

    @Column({
        type: 'enum',
        enum: ['ADMIN', 'SUPERVISOR', 'CAJERO'],
        default: 'CAJERO'
    })
    role!: string;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    async transformToUpperCase() {
        this.username = this.username.toUpperCase();
        this.fullName = this.fullName.toUpperCase();
        this.branchId = this.branchId.toUpperCase();
    }
} 