import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { Employee } from './entities/employee.entity.js';
import { User } from '../auth/entities/user.entity.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { managerId, ...data } = createEmployeeDto;

    const exists = await this.employeeRepository.existsBy({
      employeeEmail: data.employeeEmail,
    });
    if (exists) throw new ConflictException('Ya existe un empleado con ese correo');

    return this.employeeRepository.save({
      ...data,
      ...(managerId && { manager: { managerId } }),
    });
  }

  findAll() {
    return this.employeeRepository.find({
      relations: { manager: true, user: true },
    });
  }

  findByManager(managerId: string) {
    return this.employeeRepository.find({
      where: { manager: { managerId } },
      relations: { user: true },
    });
  }

  async findOne(id: string) {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: id },
      relations: { manager: true, user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const { managerId, ...data } = updateEmployeeDto;

    const employeeToUpdate = await this.employeeRepository.preload({
      employeeId: id,
      ...data,
      ...(managerId && { manager: { managerId } }),
    });
    if (!employeeToUpdate) throw new NotFoundException('Employee not found');

    return this.employeeRepository.save(employeeToUpdate);
  }

  async remove(id: string) {
    const employee = await this.findOne(id);

    // Se borra también su cuenta de acceso para que no quede un login huérfano
    await this.employeeRepository.manager.transaction(async (manager) => {
      await manager.delete(Employee, { employeeId: id });
      if (employee.user) {
        await manager.delete(User, { userId: employee.user.userId });
      }
    });
    return { message: 'Empleado eliminado' };
  }
}
