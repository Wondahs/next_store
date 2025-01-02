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
import { OrdersService } from '../src/orders/orders.service';
import { OrdersController } from '../src/orders/orders.controller';

describe('OrderController (e2e)', () => {
  console.log("Starting Auth test");
  let app: INestApplication;
  let authService: AuthService;
  let prismaService: PrismaService;

  const testUser = {
    email: 'testuser@example.com',
    password: 'Test@123',
    role: UserRole.REGULAR,
  };

  const testUser2 = {
    email: 'testuser2@example.com',
    password: 'Test2@123',
    role: UserRole.REGULAR,
  };

  const user1Order = {
    description: 'Order 1',
    quantity: 2,
    specifications: {
      color: 'blue',
      size: 'large',
    }
  }
  
  const user2Order = {
    description: 'Order 2',
    quantity: 2,
    specifications: {
      color: 'black',
      size: 'small',
    }
  }

  const adminUser = {
    email: 'admin@example.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
  };

  let user1AuthToken: string;
  let user2AuthToken: string;
  let adminAuthToken: string;
  let user1OrderId: number;
  let user2OrderId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, OrdersController],
      providers: [AuthService, PrismaService, JwtAuthStrategy, OrdersService],
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
      await prismaService.message.deleteMany({});
      await prismaService.chatroom.deleteMany({});
      await prismaService.order.deleteMany({});
      await prismaService.user.deleteMany({});
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }

    console.log("Ready to test");
  });

  it('should register new users and return user data', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const response2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser2)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toEqual(testUser.email);
    expect(response.body.role).toEqual(testUser.role);

    expect(response2.body).toHaveProperty('id');
    expect(response2.body.email).toEqual(testUser2.email);
    expect(response2.body.role).toEqual(testUser2.role);
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
  

  it('regular users should login with valid credentials and return a JWT token', async () => {

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);
    
      user1AuthToken = response.body.access_token;

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');

    const response2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser2.email,
        password: testUser2.password,
      })
      .expect(201);
    
      user2AuthToken = response2.body.access_token;

    expect(response2.body).toHaveProperty('access_token');
    expect(typeof response2.body.access_token).toBe('string');
  });
  
  it('admin should login with valid credentials and return a JWT token', async () => {

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      })
      .expect(201);
    
      adminAuthToken = response.body.access_token;

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
  });
  
  it('user1 should create an order', async () => {

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send(user1Order)
      .set('Authorization', `Bearer ${user1AuthToken}`)
      .expect(201);
    

      console.log("User1 Order response: ", response.body);
      user1OrderId = response.body.id;

    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.access_token).toBe('object');
  });


  afterAll(async () => {
    try {
      await prismaService.message.deleteMany({});
      await prismaService.chatroom.deleteMany({});
      await prismaService.order.deleteMany({});
      await prismaService.user.deleteMany({});
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }

    await app.close();
  });
});
