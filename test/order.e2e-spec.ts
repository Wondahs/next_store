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
  // console.log("Starting Order test");
  let app: INestApplication;
  let authService: AuthService;
  let prismaService: PrismaService;

  const testUser = {
    email: 'user@example.com',
    password: 'Test@123',
    role: UserRole.REGULAR,
  };

  const testUser2 = {
    email: 'user2@example.com',
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
    email: 'admin1@example.com',
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
      await prismaService.$transaction(async (tx) => {
        await tx.message.deleteMany()
        await tx.chatroom.deleteMany()
        await tx.order.deleteMany()
        await tx.user.deleteMany();
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }

    // console.log("Ready to test");
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

  it('user should fail create an order with incomplete fields', async () => {
    // Try without quantity
    let response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        description: user1Order.description
      })
      .set('Authorization', `Bearer ${user1AuthToken}`)
      .expect(409);

    expect(response.body).toHaveProperty('error', 'Conflict');
    expect(response.body).toHaveProperty('message', "Quantity Missing");

    // Try without speccification
    response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        description: user1Order.description,
        quantity: user1Order.quantity
      })
      .set('Authorization', `Bearer ${user1AuthToken}`)
      .expect(409);

    expect(response.body).toHaveProperty('error', 'Conflict');
    expect(response.body).toHaveProperty('message', "Specifications Missing");
  });

  it('user1 should create an order', async () => {

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send(user1Order)
      .set('Authorization', `Bearer ${user1AuthToken}`)
      .expect(201);

    const decoded = require('jsonwebtoken').decode(user1AuthToken);
    // console.log(decoded)
    user1OrderId = response.body.newOrder.id;

    expect(typeof response.body).toBe('object');
    expect(response.body).toHaveProperty('newOrder');
    expect(response.body).toHaveProperty('chatroom');
  });

  it('user2 should create an order', async () => {

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send(user2Order)
      .set('Authorization', `Bearer ${user2AuthToken}`)
      .expect(201);

    user2OrderId = response.body.newOrder.id;

    expect(typeof response.body).toBe('object');
    expect(response.body).toHaveProperty('newOrder');
    expect(response.body).toHaveProperty('chatroom');
  });

  it('user1 should see only their orders', async () => {

    const response = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${user1AuthToken}`)
      .expect(200);

    // console.log("User1 Order response: ", response.body);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', user1OrderId);
    expect(response.body[0]).toHaveProperty('chatroom');
  });

  it('user2 should see only their orders', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${user2AuthToken}`)
      .expect(200);


    // console.log("User1 Order response: ", response.body);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('id', user2OrderId);
    expect(response.body[0]).toHaveProperty('chatroom');
  });

  it('user1 should fail to see user2 orders', async () => {

    const response = await request(app.getHttpServer())
      .get(`/orders/${user2OrderId}`)
      .set('Authorization', `Bearer ${user1AuthToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error', "Unauthorized");
    expect(response.body).toHaveProperty('message', "You are not authorized to see this order");
  });

  it('user2 should fail to see user1 orders', async () => {

    const response = await request(app.getHttpServer())
      .get(`/orders/${user1OrderId}`)
      .set('Authorization', `Bearer ${user2AuthToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error', "Unauthorized");
    expect(response.body).toHaveProperty('message', "You are not authorized to see this order");
  });

  it('Admin should should see all orders', async () => {

    const response = await request(app.getHttpServer())
      .get(`/orders`)
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .expect(200);

    expect(response.body.length).toBe(2); // Length of total orders
    expect(response.body[0]).toHaveProperty('id', user1OrderId); // Order for user1
    expect(response.body[1]).toHaveProperty('id', user2OrderId); // Order for user2
  });

  afterAll(async () => {
    try {
      // await prismaService.message.deleteMany({});
      // await prismaService.chatroom.deleteMany({});
      // await prismaService.order.deleteMany({});
      // await prismaService.user.deleteMany({});
      await prismaService.$transaction(async (tx) => {
        await tx.message.deleteMany()
        await tx.chatroom.deleteMany()
        await tx.order.deleteMany()
        await tx.user.deleteMany();
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }

    await app.close();
  });
});
