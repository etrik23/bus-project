/// <reference types="multer" />
import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { VerifyIdentityDto } from './dto/verify-identity.dto.js';
import { ApiAuth } from './decorators/api.decorator.js';
import { Auth } from './decorators/auth.decorator.js';
import { UserData } from './decorators/user.decorator.js';
import { TOKEN_MAX_AGE, TOKEN_NAME } from './constants/jwt.constants.js';
import { BUYER_ROLES, OPERATOR_ROLES, ROLES } from './constants/roles.constants.js';
import { IDENTITY_FILE_TYPES, IDENTITY_MAX_FILE_SIZE } from './constants/identity.constants.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
} as const;

@ApiAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------- Registro ----------
  // Cualquier persona puede crear una cuenta de cliente
  @Post('register/customer')
  registerCustomer(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerCustomer(createUserDto);
  }

  // Solo el Admin crea cuentas de manager
  @Auth()
  @Post('register/manager/:id')
  registerManager(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.authService.registerManager(id, createUserDto);
  }

  // Manager (o Admin) crea cuentas de empleado
  @Auth(ROLES.MANAGER)
  @Post('register/employee/:id')
  registerEmployee(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.authService.registerEmployee(id, createUserDto);
  }

  // ---------- Sesión ----------
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, userRoles } = await this.authService.loginUser(loginUserDto);
    response.cookie(TOKEN_NAME, token, { ...COOKIE_OPTIONS, maxAge: TOKEN_MAX_AGE });
    return { userRoles };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(TOKEN_NAME, COOKIE_OPTIONS);
    return { message: 'Sesión cerrada' };
  }

  // ---------- Perfil propio ----------
  @Auth(...BUYER_ROLES)
  @Get('me')
  me(@UserData() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Auth(...BUYER_ROLES)
  @Patch('me')
  updateMe(@UserData() user: JwtPayload, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateProfile(user.sub, updateUserDto);
  }

  // ---------- Bonus: verificación de identidad ----------
  @Auth(ROLES.CUSTOMER)
  @Post('identity')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { identityDocument: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('identityDocument'))
  uploadIdentity(
    @UserData() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: IDENTITY_MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: IDENTITY_FILE_TYPES }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.authService.uploadIdentity(user.sub, file);
  }

  @Auth(...OPERATOR_ROLES)
  @Get('identity/pending')
  findPendingIdentities() {
    return this.authService.findPendingIdentities();
  }

  @Auth(...OPERATOR_ROLES)
  @Get('identity/:userId/document')
  getIdentityDocument(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    return this.authService.getIdentityDocumentUrl(userId);
  }

  @Auth(...OPERATOR_ROLES)
  @Patch('identity/:userId')
  reviewIdentity(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() verifyIdentityDto: VerifyIdentityDto,
  ) {
    return this.authService.reviewIdentity(userId, verifyIdentityDto);
  }
}
