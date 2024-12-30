import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    // Create a new order
    const order = await this.prisma.order.create({
      data: {
        description: createOrderDto.description,
        specifications: createOrderDto.specifications,
        quantity: createOrderDto.quantity,
        status: 'REVIEW',
        userId,
      }
    });

    await this.prisma.chatroom.create({
      data: {
        orderId: order.id,
        isClosed: false,
      }
    });

    return order;
  }

  async getUserOrders(userId: number, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.order.findMany();
    }

    return this.prisma.order.findMany({
      where: {
        userId,
      }
    });
  }
}
