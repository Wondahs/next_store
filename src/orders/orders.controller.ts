/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/auth/user.decorator';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @User('id') userId: number,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  findOrders(
    @User('id') userid: number,
    @User('role') role: string
  ) {
    return this.ordersService.getUserOrders(userid, role);
  }

  @Get(':id')
  findOrder(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userid: number,
    @User('role') role: string
  ) {
    return this.ordersService.getOneOrder(id, userid, role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body('status') status: OrderStatus,
    @User('role') role: string,
  ) {
    return this.ordersService.updateOrderStatus(orderId, status, role);
  }
}
