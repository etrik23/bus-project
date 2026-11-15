import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Manager } from '../../managers/entities/manager.entity.js';
import { User } from '../../auth/entities/user.entity.js';

@Entity()
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  employeeId: string;

  @Column('text')
  employeeName: string;

  @Column('text')
  employeeLastName: string;

  @Column('text')
  employeePhoneNumber: string;

  @Column('text', { unique: true })
  employeeEmail: string;

  @ManyToOne(() => Manager, (manager) => manager.employees, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'managerId' })
  manager: Relation<Manager> | null;

  @OneToOne(() => User, (user) => user.employee, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User> | null;
}
