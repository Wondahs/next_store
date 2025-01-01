/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('OrdersController', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [OrdersService, PrismaService, JwtService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Set up user and admin data
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: 'password',
        role: UserRole.USER,
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: 'password',
        role: UserRole.ADMIN,
      },
    });

    userToken = jwtService.sign({ id: user.id, email: user.email, role: user.role });
    adminToken = jwtService.sign({ id: admin.id, email: admin.email, role: admin.role });
  });

  afterAll(async () => {
    // Clean up users and orders after tests
    await prisma.user.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.chatroom.deleteMany({});
  });

  it('should create an order (POST /orders)', async () => {
    const createOrderDto = {
      description: 'Order description',
      specifications: 'Order specifications',
      quantity: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(createOrderDto)
      .expect(201);

    expect(response.body.newOrder).toHaveProperty('id');
    expect(response.body.newOrder.description).toBe(createOrderDto.description);
    expect(response.body.newOrder.specifications).toBe(createOrderDto.specifications);
    expect(response.body.newOrder.quantity).toBe(createOrderDto.quantity);
  });

  it('should get user orders (GET /orders)', async () => {
    await prisma.order.create({
      data: {
        description: 'Another order',
        specifications: 'Order specifications',
        quantity: 5,
        status: 'REVIEW',
        userId: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].description).toBe('Another order');
  });

  it('should get one order (GET /orders/:id)', async () => {
    const order = await prisma.order.create({
      data: {
        description: 'Single order',
        specifications: 'Order specifications',
        quantity: 1,
        status: 'REVIEW',
        userId: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(order.id);
  });

  it('should update order status (PATCH /orders/:id/status) for admin', async () => {
    const order = await prisma.order.create({
      data: {
        description: 'Status change order',
        specifications: 'Order specs',
        quantity: 1,
        status: 'REVIEW',
        userId: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PROCESSING' })
      .expect(200);

    expect(response.body.status).toBe('PROCESSING');
  });

  it('should throw forbidden for non-admin user updating order status (PATCH /orders/:id/status)', async () => {
    const order = await prisma.order.create({
      data: {
        description: 'Status change order',
        specifications: 'Order specs',
        quantity: 1,
        status: 'REVIEW',
        userId: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'PROCESSING' })
      .expect(403);

    expect(response.body.message).toBe('Unauthorized: Only admins can update order status');
  });
});
