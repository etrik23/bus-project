import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoutesService } from './routes.service.js';
import { CreateRouteDto } from './dto/create-route.dto.js';
import { UpdateRouteDto } from './dto/update-route.dto.js';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { ApiAuth } from '../auth/decorators/api.decorator.js';
import { OPERATOR_ROLES, ROLES } from '../auth/constants/roles.constants.js';

@ApiAuth()
@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Auth(ROLES.MANAGER)
  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  // Público: los clientes ven las rutas disponibles
  @Get()
  findAllActive() {
    return this.routesService.findAllActive();
  }

  // Debe ir antes de ':id'
  @Auth(...OPERATOR_ROLES)
  @Get('all')
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.routesService.findOne(id);
  }

  @Auth(ROLES.MANAGER)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routesService.update(id, updateRouteDto);
  }

  // Desactiva la ruta
  @Auth(ROLES.MANAGER)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.routesService.remove(id);
  }
}
