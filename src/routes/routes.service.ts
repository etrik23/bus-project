import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto.js';
import { UpdateRouteDto } from './dto/update-route.dto.js';
import { Route } from './entities/route.entity.js';

// Rutas iniciales de la empresa. Distancias, duraciones y precios son de ejemplo.
// Nuevas rutas se agregan con POST /routes, sin tocar el código.
const DEFAULT_ROUTES: CreateRouteDto[] = [
  { routeOrigin: 'Oaxaca', routeDestination: 'Puebla', routeDistanceKm: 340, routeDurationMinutes: 300, routeBasePrice: 450 },
  { routeOrigin: 'Chihuahua', routeDestination: 'Nuevo León', routeDistanceKm: 900, routeDurationMinutes: 660, routeBasePrice: 1100 },
  { routeOrigin: 'Baja California Norte', routeDestination: 'Baja California Sur', routeDistanceKm: 1500, routeDurationMinutes: 1200, routeBasePrice: 1800 },
  { routeOrigin: 'Chihuahua', routeDestination: 'CDMX', routeDistanceKm: 1450, routeDurationMinutes: 1080, routeBasePrice: 1700 },
];

@Injectable()
export class RoutesService implements OnModuleInit {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
  ) {}

  // Solo siembra las rutas cuando la tabla está vacía
  async onModuleInit() {
    if ((await this.routeRepository.count()) > 0) return;
    await this.routeRepository.save(DEFAULT_ROUTES);
  }

  async create(createRouteDto: CreateRouteDto) {
    await this.assertValid(createRouteDto.routeOrigin, createRouteDto.routeDestination);
    return this.routeRepository.save(createRouteDto);
  }

  /** Rutas disponibles para la venta (públicas). */
  findAllActive() {
    return this.routeRepository.find({
      where: { routeIsActive: true },
      order: { routeOrigin: 'ASC', routeDestination: 'ASC' },
    });
  }

  /** Todas las rutas, incluso las desactivadas (personal). */
  findAll() {
    return this.routeRepository.find({
      order: { routeOrigin: 'ASC', routeDestination: 'ASC' },
    });
  }

  async findOne(id: string) {
    const route = await this.routeRepository.findOneBy({ routeId: id });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const route = await this.routeRepository.preload({
      routeId: id,
      ...updateRouteDto,
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');

    await this.assertValid(route.routeOrigin, route.routeDestination, id);
    return this.routeRepository.save(route);
  }

  // Desactiva la ruta (no se borra para conservar sus viajes y boletos)
  async remove(id: string) {
    await this.findOne(id);
    await this.routeRepository.update({ routeId: id }, { routeIsActive: false });
    return { message: 'Ruta desactivada' };
  }

  private async assertValid(origin: string, destination: string, ignoreId?: string) {
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      throw new BadRequestException('El origen y el destino no pueden ser iguales');
    }

    const existing = await this.routeRepository.findOneBy({
      routeOrigin: origin,
      routeDestination: destination,
    });
    if (existing && existing.routeId !== ignoreId) {
      throw new ConflictException('Ya existe una ruta con ese origen y destino');
    }
  }
}
