import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { ApiAuth } from '../auth/decorators/api.decorator.js';
import { UserData } from '../auth/decorators/user.decorator.js';
import { BUYER_ROLES, OPERATOR_ROLES } from '../auth/constants/roles.constants.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiAuth()
@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Confirma la compra de los asientos apartados
  @Auth(...BUYER_ROLES)
  @Post('purchase')
  purchase(@UserData() user: JwtPayload, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.purchase(user, createTicketDto);
  }

  // Mis boletos (debe ir antes de ':id')
  @Auth(...BUYER_ROLES)
  @Get('my')
  findMine(@UserData() user: JwtPayload) {
    return this.ticketsService.findMine(user.sub);
  }

  @Auth(...OPERATOR_ROLES)
  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  // El dueño o el personal
  @Auth(...BUYER_ROLES)
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UserData() user: JwtPayload,
  ) {
    return this.ticketsService.findOne(id, user);
  }

  @Auth(...OPERATOR_ROLES)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  // El dueño o el personal
  @Auth(...BUYER_ROLES)
  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UserData() user: JwtPayload,
  ) {
    return this.ticketsService.cancel(id, user);
  }
}
