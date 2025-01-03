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
import { ChatroomController } from '../src/chatroom/chatroom.controller';
import { ChatroomService } from '../src/chatroom/chatroom.service';

describe('ChatController (e2e)', () => {
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
        email: 'admin2@example.com',
        password: 'Admin@123',
        role: UserRole.ADMIN,
    };

    const user1Message = {
        message: "User1 Message"
    }

    const user2Message = {
        message: "User2 Message"
    }
    
    const adminMessage = {
        message: "Admin Message"
    }

    let user1AuthToken: string;
    let user2AuthToken: string;
    let adminAuthToken: string;
    let user1OrderId: number;
    let user2OrderId: number;
    let user1ChatroomId: number;
    let user2ChatroomId: number;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController, OrdersController, ChatroomController],
            providers: [AuthService, PrismaService, JwtAuthStrategy, OrdersService, ChatroomService],
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

    it('users should create an order and orders must return a chatroom', async () => {

        const user1Response = await request(app.getHttpServer())
            .post('/orders')
            .send(user1Order)
            .set('Authorization', `Bearer ${user1AuthToken}`)
            .expect(201);

        user1OrderId = user1Response.body.newOrder.id;

        expect(typeof user1Response.body).toBe('object');
        expect(user1Response.body).toHaveProperty('newOrder');
        expect(user1Response.body).toHaveProperty('chatroom');

        user1ChatroomId = user1Response.body.chatroom.id;

        const user2Response = await request(app.getHttpServer())
            .post('/orders')
            .send(user2Order)
            .set('Authorization', `Bearer ${user2AuthToken}`)
            .expect(201);

        user2OrderId = user2Response.body.newOrder.id;

        expect(typeof user2Response.body).toBe('object');
        expect(user2Response.body).toHaveProperty('newOrder');
        expect(user2Response.body).toHaveProperty('chatroom');

        user2ChatroomId = user2Response.body.chatroom.id;
    });

    it('user1 should see only chatrooms related to their orders', async () => {

        const response = await request(app.getHttpServer())
            .get('/chatrooms')
            .set('Authorization', `Bearer ${user1AuthToken}`)
            .expect(200);

        // console.log("User1 Order response: ", response.body);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('orderId', user1OrderId);
    });

    it('user2 should see only chatrooms related to their orders', async () => {

        const response = await request(app.getHttpServer())
            .get('/chatrooms')
            .set('Authorization', `Bearer ${user2AuthToken}`)
            .expect(200);

        // console.log("User1 Order response: ", response.body);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('orderId', user2OrderId);
    });

    it('user1 should not see chatrooms related to user2', async () => {

        const response = await request(app.getHttpServer())
            .get(`/chatrooms/${user2ChatroomId}`)
            .set('Authorization', `Bearer ${user1AuthToken}`)
            .expect(401);

        // console.log("User1 Order response: ", response.body);
        expect(response.body).toHaveProperty('error', "Unauthorized");
    });

    it('user1 should send a message to chatrooms connected to their orders', async () => {

        const response = await request(app.getHttpServer())
            .post(`/chatrooms/${user1ChatroomId}/create-message`)
            .send(user1Message)
            .set('Authorization', `Bearer ${user1AuthToken}`)
            .expect(201);

        // expect(response.body.length).toBe(2);
        expect(response.body).toHaveProperty('content', user1Message.message);
        
    });

    it('user2 should send a message to chatrooms connected to their orders', async () => {

        const response = await request(app.getHttpServer())
            .post(`/chatrooms/${user2ChatroomId}/create-message`)
            .send(user2Message)
            .set('Authorization', `Bearer ${user2AuthToken}`)
            .expect(201);

        // expect(response.body.length).toBe(2);
        expect(response.body).toHaveProperty('content', user2Message.message);
    });

    it('user2 should fail to send a message to chatrooms connected to user1 orders', async () => {

        const response = await request(app.getHttpServer())
            .post(`/chatrooms/${user1ChatroomId}/create-message`)
            .send(user2Message)
            .set('Authorization', `Bearer ${user2AuthToken}`)
            .expect(401);

        // expect(response.body.length).toBe(2);
        expect(response.body).toHaveProperty('error', "Unauthorized");
    });

    it('user1 should see to send all messages in chatrooms connected to their orders', async () => {

        const response = await request(app.getHttpServer())
            .get(`/chatrooms/${user1ChatroomId}/messages`)
            .send(user1Message)
            .set('Authorization', `Bearer ${user1AuthToken}`)
            .expect(200);

        // console.log(response.body);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('content', user1Message.message);
    });

    it('user1 should fail to see messages in chatrooms connected to other users orders', async () => {

        const response = await request(app.getHttpServer())
            .get(`/chatrooms/${user2ChatroomId}/messages`)
            .set('Authorization', `Bearer ${user1AuthToken}`)
            .expect(401);

        // console.log(response.body);
        expect(response.body).toHaveProperty('error', "Unauthorized");
    });

    it('Admins should see all chatrooms', async () => {

        const response = await request(app.getHttpServer())
            .get('/chatrooms')
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .expect(200);

        expect(response.body.length).toBe(2);
        expect(response.body[0]).toHaveProperty('orderId', user1OrderId);
        expect(response.body[1]).toHaveProperty('orderId', user2OrderId);
    });

    
    it('Admins should send message to all chatrooms', async () => {
        // Try order for user1
        const response = await request(app.getHttpServer())
            .post(`/chatrooms/${user1ChatroomId}/create-message`)
            .send(adminMessage)
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .expect(201);

        expect(response.body).toHaveProperty('content', adminMessage.message);

        // Try order for user2
        const response2 = await request(app.getHttpServer())
            .post(`/chatrooms/${user2ChatroomId}/create-message`)
            .send(adminMessage)
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .expect(201);

        expect(response2.body).toHaveProperty('content', adminMessage.message);
    });
    
    it('Admin should see messages in all chatrooms connected to other users orders', async () => {
        // Try for user1 order
        const response = await request(app.getHttpServer())
            .get(`/chatrooms/${user1ChatroomId}/messages`)
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .expect(200);

        // console.log(response.body);
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toHaveProperty('content', user1Message.message);
        expect(response.body[1]).toHaveProperty('content', adminMessage.message);
        
        // Try for user2 order
        const response2 = await request(app.getHttpServer())
            .get(`/chatrooms/${user2ChatroomId}/messages`)
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .expect(200);

        // console.log(response.body);
        expect(response2.body.length).toBe(2);
        expect(response2.body[0]).toHaveProperty('content', user2Message.message);
        expect(response2.body[1]).toHaveProperty('content', adminMessage.message);
    });


    afterAll(async () => {
        try {
            //   await prismaService.message.deleteMany({});
            //   await prismaService.chatroom.deleteMany({});
            //   await prismaService.order.deleteMany({});
            //   await prismaService.user.deleteMany({});
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
