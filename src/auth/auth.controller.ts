/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/create-auth.dto';
import { User } from './user.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  users(@User('role') role: UserRole) {
    // console.log(role);
    return this.authService.users(role);
  }
}
