import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManagerDto } from './dto/create-manager.dto.js';
import { UpdateManagerDto } from './dto/update-manager.dto.js';
import { Manager } from './entities/manager.entity.js';
import { User } from '../auth/entities/user.entity.js';

@Injectable()
export class ManagersService {
  constructor(
    @InjectRepository(Manager)
    private managerRepository: Repository<Manager>,
  ) {}

  async create(createManagerDto: CreateManagerDto) {
    const exists = await this.managerRepository.existsBy({
      managerEmail: createManagerDto.managerEmail,
    });
    if (exists) throw new ConflictException('Ya existe un manager con ese correo');

    return this.managerRepository.save(createManagerDto);
  }

  findAll() {
    return this.managerRepository.find({
      relations: { user: true },
    });
  }

  async findOne(id: string) {
    const manager = await this.managerRepository.findOne({
      where: { managerId: id },
      relations: { employees: true, user: true },
    });
    if (!manager) throw new NotFoundException('No manager found');
    return manager;
  }

  async update(id: string, updateManagerDto: UpdateManagerDto) {
    const managerToUpdate = await this.managerRepository.preload({
      managerId: id,
      ...updateManagerDto,
    });
    if (!managerToUpdate) throw new NotFoundException('No manager found');
    return this.managerRepository.save(managerToUpdate);
  }

  async remove(id: string) {
    const manager = await this.findOne(id);

    // Se borra también su cuenta de acceso para que no quede un login huérfano
    await this.managerRepository.manager.transaction(async (manager_) => {
      await manager_.delete(Manager, { managerId: id });
      if (manager.user) {
        await manager_.delete(User, { userId: manager.user.userId });
      }
    });
    return { message: 'Manager eliminado' };
  }
}
