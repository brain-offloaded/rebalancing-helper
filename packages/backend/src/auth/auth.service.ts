import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { User as PrismaUser } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './entities/auth-payload.entity';
import { ActiveUserData } from './auth.types';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(input: RegisterInput): Promise<AuthPayload> {
    const existingUser = await this.usersService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const passwordHash = await hash(input.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: input.email,
      passwordHash,
    });

    return this.buildAuthPayload(user);
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthPayload(user);
  }

  async getActiveUserData(userId: string): Promise<ActiveUserData> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { userId: user.id, email: user.email };
  }

  private buildAuthPayload(user: PrismaUser): AuthPayload {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user,
    };
  }
}
