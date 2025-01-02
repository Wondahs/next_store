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

describe('AuthController (e2e)', () => {
  console.log("Starting Auth test");
  let app: INestApplication;
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Setup user data
  const testUser = {
    email: 'testuser@example.com',
    password: 'Test@123',
    role: UserRole.REGULAR,
  };

  // User data for an admin
  const adminUser = {
    email: 'admin@example.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, PrismaService, JwtService],
      imports: [PrismaModule, PassportModule,
          JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              secret: configService.get<string>('JWT_SECRET'),
              signOptions: { expiresIn: '1d' },
            }),
          })
        ]
    }).compile();

    app = module.createNestApplication();
    await app.init();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Cleanup database before tests
    await prismaService.user.deleteMany({});
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

  it('should login with valid credentials and return a real JWT token', async () => {
    // Delete old registered user first
    await prismaService.user.delete({where: {email: testUser.email}});
    console.log("Deleted old user");
    // Register user first
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    // Now login with the same user credentials
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });

  // it('should return all users for admin with valid JWT', async () => {
  //   // Register and login admin user
  //   await request(app.getHttpServer())
  //     .post('/auth/register')
  //     .send(adminUser)
  //     .expect(201);

  //   const loginResponse = await request(app.getHttpServer())
  //     .post('/auth/login')
  //     .send({
  //       email: adminUser.email,
  //       password: adminUser.password,
  //     })
  //     .expect(200);

  //   const adminToken = loginResponse.body.access_token;

  //   const response = await request(app.getHttpServer())
  //     .get('/auth/users')
  //     .set('Authorization', `Bearer ${adminToken}`)
  //     .expect(200);

  //   expect(response.body).toBeInstanceOf(Array);
  //   expect(response.body[0]).toHaveProperty('email');
  // });

  // it('should return unauthorized for non-admin users accessing /auth/users', async () => {
  //   // Register and login regular user
  //   await request(app.getHttpServer())
  //     .post('/auth/register')
  //     .send(testUser)
  //     .expect(201);

  //   const loginResponse = await request(app.getHttpServer())
  //     .post('/auth/login')
  //     .send({
  //       email: testUser.email,
  //       password: testUser.password,
  //     })
  //     .expect(200);

  //   const userToken = loginResponse.body.access_token;

  //   const response = await request(app.getHttpServer())
  //     .get('/auth/users')
  //     .set('Authorization', `Bearer ${userToken}`)
  //     .expect(403);

  //   expect(response.body.message).toEqual('Forbidden resource');
  // });

  afterAll(async () => {
    // Clean up after tests
    await prismaService.user.deleteMany({});
    await app.close();
  });
});
