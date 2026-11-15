import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity.js';
import { User } from '../../auth/entities/user.entity.js';

@Entity()
export class Manager {
  @PrimaryGeneratedColumn('uuid')
  managerId: string;

  @Column('text')
  managerFullName: string;

  @Column('float')
  managerSalary: number;

  @Column('text', { unique: true })
  managerEmail: string;

  @Column('text')
  managerPhoneNumber: string;

  @OneToMany(() => Employee, (employee) => employee.manager)
  employees: Relation<Employee[]>;

  @OneToOne(() => User, (user) => user.manager, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User> | null;
}
