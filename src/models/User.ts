import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { hash } from 'bcryptjs';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column()
  branchId: string;

  @Column()
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async transformToUpperCase() {
    this.username = this.username.toUpperCase();
    this.fullName = this.fullName.toUpperCase();
    this.branchId = this.branchId.toUpperCase();
    this.role = this.role.toUpperCase();
  }
} 