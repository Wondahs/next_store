/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    // Create a new order and its associated chatroom in a transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // create new order
      const newOrder = await prisma.order.create({
        data: {
          description: createOrderDto.description,
          specifications: createOrderDto.specifications,
          quantity: createOrderDto.quantity,
          status: 'REVIEW',
          userId,
        },
      });

      const chatroom = await prisma.chatroom.create({
        data: {
          userId,
          orderId: newOrder.id,
          isClosed: false,
        },
      });

      return { newOrder, chatroom };
    });

    return order;
  }

  async getUserOrders(userId: number, role: string) {
    if (role === UserRole.ADMIN) {
      return this.prisma.order.findMany({
        include: { chatroom: true },
      });
    }

    return this.prisma.order.findMany({
      where: {
        userId,
      },
      include: { chatroom: true },
    });
  }

  async getOneOrder(id: number, userId: number, role: string) {
    const order = role === 'ADMIN' ?
      await this.prisma.order.findUnique({ where: { id }, include: { chatroom: true } }) :
      await this.prisma.order.findUnique({ where: { userId, id }, include: { chatroom: true } });
    if (!order) {
      throw new NotFoundException(`Order with id: ${id} not found`);
    }
    return order;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus, userRole: string) {
    // Throw error if user isn't an admin
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Unauthorized: Only admins can update order status');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { chatroom: true },
    });

    // Throw error if order not found
    if (!order) {
      throw new NotFoundException(`Order with id: ${orderId} not  found`);
    }

    // Ensure chatroom is closed before moving to PROCESSING
    if (status === 'PROCESSING' && order.chatroom && !order.chatroom.isClosed) {
      throw new ForbiddenException('Chat must be closed before moving to Processing');
    }

    return await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
