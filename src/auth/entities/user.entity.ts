import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity.js';
import { Manager } from '../../managers/entities/manager.entity.js';
import { ROLES } from '../constants/roles.constants.js';
import { IDENTITY_STATUS } from '../constants/identity.constants.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column('text', { unique: true })
  userEmail: string;

  // select:false => nunca sale en las consultas por defecto
  @Column('text', { select: false })
  userPassword: string;

  @Column('text')
  userFullName: string;

  @Column('simple-array', { default: ROLES.CUSTOMER })
  userRoles: string[];

  // Key del archivo en S3 (bonus: verificación de identidad)
  @Column({ type: 'text', nullable: true })
  userIdentityDocument: string | null;

  @Column({ type: 'enum', enum: IDENTITY_STATUS, default: IDENTITY_STATUS.NONE })
  userIdentityStatus: IDENTITY_STATUS;

  @CreateDateColumn()
  userCreatedAt: Date;

  @OneToOne(() => Manager, (manager) => manager.user)
  manager: Relation<Manager>;

  @OneToOne(() => Employee, (employee) => employee.user)
  employee: Relation<Employee>;
}
