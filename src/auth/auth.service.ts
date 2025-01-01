/* eslint-disable prettier/prettier */
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtservice: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      // Hash password before saving it to the database
      const hashedpasswod = await bcrypt.hash(registerDto.password, 10);
  
      // Save user to the database
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedpasswod,
          role: registerDto.role,
        }
      })
      const { password, ...result } = user;
      return result;
    } catch (error) {
      // Catch error related to multiple registration of a single email
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(loginDto: LoginDto) {
    // Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: {email: loginDto.email},
    });

    console.log(user);

    // If the user does not exist, throw an unauthorized error
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if the user password is correct and throw an error if password is invalid
    const validPassword = await bcrypt.compare(loginDto.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    }

    return {
      access_token: this.jwtservice.sign(payload),
    }
  }

  
  async users(
    role: UserRole
  ) {
    if (role !== UserRole.ADMIN) throw new UnauthorizedException("You do not have authentication for this action");
    return await this.prisma.user.findMany();
  }
}
