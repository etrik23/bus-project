/// <reference types="multer" />
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { VerifyIdentityDto } from './dto/verify-identity.dto.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { Manager } from '../managers/entities/manager.entity.js';
import { AwsService } from '../aws/aws.service.js';
import { ROLES } from './constants/roles.constants.js';
import { IDENTITY_STATUS } from './constants/identity.constants.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    @InjectRepository(Manager) private managerRepository: Repository<Manager>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private awsService: AwsService,
  ) {}

  // ---------- Admin inicial ----------
  async onModuleInit() {
    const email = this.configService.get<string>('admin_email');
    const password = this.configService.get<string>('admin_pass');
    if (!email || !password) {
      this.logger.warn(
        'admin_email / admin_pass no definidos: no se creó el administrador inicial',
      );
      return;
    }

    const exists = await this.userRepository.existsBy({ userEmail: email });
    if (exists) return;

    await this.userRepository.save({
      userEmail: email,
      userPassword: await bcrypt.hash(password, SALT_ROUNDS),
      userFullName: 'Administrador',
      userRoles: [ROLES.ADMIN],
    });
    this.logger.log(`Administrador inicial creado (${email})`);
  }

  // ---------- Registro ----------
  async registerCustomer(createUserDto: CreateUserDto) {
    const user = await this.createUser(createUserDto, [ROLES.CUSTOMER]);
    return this.toPublicUser(user);
  }

  async registerEmployee(id: string, createUserDto: CreateUserDto) {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: id },
      relations: { user: true },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    if (employee.user) throw new ConflictException('El empleado ya tiene una cuenta');

    const user = await this.createUser(createUserDto, [ROLES.EMPLOYEE]);
    employee.user = user;
    await this.employeeRepository.save(employee);
    return this.toPublicUser(user);
  }

  async registerManager(id: string, createUserDto: CreateUserDto) {
    const manager = await this.managerRepository.findOne({
      where: { managerId: id },
      relations: { user: true },
    });
    if (!manager) throw new NotFoundException('Manager no encontrado');
    if (manager.user) throw new ConflictException('El manager ya tiene una cuenta');

    const user = await this.createUser(createUserDto, [ROLES.MANAGER]);
    manager.user = user;
    await this.managerRepository.save(manager);
    return this.toPublicUser(user);
  }

  // ---------- Login ----------
  async loginUser(loginUserDto: LoginUserDto) {
    // userPassword tiene select:false, hay que pedirlo explícitamente
    const user = await this.userRepository.findOne({
      where: { userEmail: loginUserDto.userEmail },
      select: {
        userId: true,
        userEmail: true,
        userPassword: true,
        userRoles: true,
      },
    });
    if (!user) throw new UnauthorizedException('No estas autorizado');

    const match = await bcrypt.compare(loginUserDto.userPassword, user.userPassword);
    if (!match) throw new UnauthorizedException('No estas autorizado');

    // El payload ya NO incluye el hash de la contraseña
    const payload: JwtPayload = {
      sub: user.userId,
      userEmail: user.userEmail,
      userRoles: user.userRoles,
    };
    const token = await this.jwtService.signAsync(payload);
    return { token, userRoles: user.userRoles };
  }

  // ---------- Perfil ----------
  async getProfile(userId: string) {
    const user = await this.userRepository.findOneBy({ userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const { userPassword, ...rest } = updateUserDto;
    const user = await this.userRepository.preload({
      userId,
      ...rest,
      ...(userPassword && {
        userPassword: await bcrypt.hash(userPassword, SALT_ROUNDS),
      }),
    });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);

    await this.userRepository.save(user);
    return this.toPublicUser(user);
  }

  // ---------- Bonus: verificación de identidad ----------
  async uploadIdentity(userId: string, file: Express.Multer.File) {
    const key = await this.awsService.uploadFile(file, `identity/${userId}`);
    await this.userRepository.update(
      { userId },
      { userIdentityDocument: key, userIdentityStatus: IDENTITY_STATUS.PENDING },
    );
    return { userIdentityStatus: IDENTITY_STATUS.PENDING };
  }

  findPendingIdentities() {
    return this.userRepository.find({
      where: { userIdentityStatus: IDENTITY_STATUS.PENDING },
      select: {
        userId: true,
        userEmail: true,
        userFullName: true,
        userIdentityStatus: true,
        userCreatedAt: true,
      },
      order: { userCreatedAt: 'ASC' },
    });
  }

  async getIdentityDocumentUrl(userId: string) {
    const user = await this.userRepository.findOneBy({ userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.userIdentityDocument) {
      throw new NotFoundException('El usuario no ha subido un documento');
    }
    return { url: await this.awsService.getPresignedUrl(user.userIdentityDocument) };
  }

  async reviewIdentity(userId: string, dto: VerifyIdentityDto) {
    const user = await this.userRepository.findOneBy({ userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.userIdentityDocument) {
      throw new BadRequestException('El usuario no ha subido un documento');
    }

    await this.userRepository.update(
      { userId },
      { userIdentityStatus: dto.userIdentityStatus },
    );
    return { userId, userIdentityStatus: dto.userIdentityStatus };
  }

  // ---------- Helpers ----------
  private async createUser(createUserDto: CreateUserDto, roles: ROLES[]) {
    const exists = await this.userRepository.existsBy({
      userEmail: createUserDto.userEmail,
    });
    if (exists) throw new ConflictException('Ya existe un usuario con ese correo');

    return this.userRepository.save({
      userEmail: createUserDto.userEmail,
      userFullName: createUserDto.userFullName,
      userPassword: await bcrypt.hash(createUserDto.userPassword, SALT_ROUNDS),
      userRoles: roles,
    });
  }

  private toPublicUser(user: User) {
    return {
      userId: user.userId,
      userEmail: user.userEmail,
      userFullName: user.userFullName,
      userRoles: user.userRoles,
    };
  }
}
