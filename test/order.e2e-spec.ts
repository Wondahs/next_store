/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import * as request from 'supertest';
import { UserRole } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthStrategy } from '../src/auth/jwt.strategy';

describe('AuthController (e2e)', () => {
  console.log("Starting Auth test");
  let app: INestApplication;
  let authService: AuthService;
  let prismaService: PrismaService;

  const testUser = {
    email: 'testuser@example.com',
    password: 'Test@123',
    role: UserRole.REGULAR,
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
  };

  let userAuthToken;
  let adminAuthToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, PrismaService, JwtAuthStrategy],
      imports: [
        PrismaModule,
        PassportModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET', 'testSecret'),
            signOptions: { expiresIn: '1d' },
          }),
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    try {
      await prismaService.user.deleteMany({});
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }

    console.log("Ready to test");
  });

  it('should register a new user and return user data', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toEqual(testUser.email);
    expect(response.body.role).toEqual(testUser.role);
  });

  it('should register a new Admin and return user data', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toEqual(adminUser.email);
    expect(response.body.role).toEqual(adminUser.role);
  });

  it('should fail to place an order without an auth token', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .expect(401);
  
    expect(response.body).toHaveProperty('statusCode', 401);
    expect(response.body.message).toEqual('Unauthorized');
  });
  

  it('should login with valid credentials and return a JWT token', async () => {

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);
    
      userAuthToken = response.body.auth

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });


  afterAll(async () => {
    try {
      await prismaService.user.deleteMany({});
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }

    await app.close();
  });
});
