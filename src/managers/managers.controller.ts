import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManagersService } from './managers.service.js';
import { CreateManagerDto } from './dto/create-manager.dto.js';
import { UpdateManagerDto } from './dto/update-manager.dto.js';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { ApiAuth } from '../auth/decorators/api.decorator.js';
import { Manager } from './entities/manager.entity.js';

// Sin roles: solo el Admin administra a los managers
@Auth()
@ApiAuth()
@ApiTags('Managers')
@Controller('managers')
export class ManagersController {
  constructor(private readonly managersService: ManagersService) {}

  @ApiResponse({
    status: 201,
    example: {
      managerFullName: 'Vladimir Medrano',
      managerSalary: 3500.5,
      managerEmail: 'vladimir@gmail.com',
      managerPhoneNumber: '4429871762',
    } as Manager,
  })
  @Post()
  create(@Body() createManagerDto: CreateManagerDto) {
    return this.managersService.create(createManagerDto);
  }

  @Get()
  findAll() {
    return this.managersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.managersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateManagerDto: UpdateManagerDto,
  ) {
    return this.managersService.update(id, updateManagerDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.managersService.remove(id);
  }
}
