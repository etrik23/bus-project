import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { ApiAuth } from '../auth/decorators/api.decorator.js';
import { ROLES } from '../auth/constants/roles.constants.js';
import { Employee } from './entities/employee.entity.js';

// Manager y Admin administran a los empleados
@Auth(ROLES.MANAGER)
@ApiAuth()
@ApiTags('Employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiResponse({
    status: 201,
    example: {
      employeeId: 'UUID',
      employeeName: 'Cedric',
      employeeLastName: 'Castro',
      employeeEmail: 'cedric@gmail.com',
      employeePhoneNumber: '4423669381',
    } as Employee,
  })
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get('manager/:managerId')
  findByManager(@Param('managerId', new ParseUUIDPipe({ version: '4' })) managerId: string) {
    return this.employeesService.findByManager(managerId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.employeesService.remove(id);
  }
}
