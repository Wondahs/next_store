/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {
  constructor(private prisma: PrismaService) { }

  async findAllChatrooms(
    role: UserRole
  ) {
    if (role !== "ADMIN") throw new UnauthorizedException("Only admins can see all chatrooms")
    return await this.prisma.chatroom.findMany();
  }

  async findOneChatroom(
    role: UserRole,
    chatroomId: number,
    userId: number
  ) {
    const chatroom = await this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
      include: {
        order: true
      }
    })
    if (!chatroom) throw new NotFoundException(`Chatroom with id ${chatroomId} not found`);
    if (chatroom.order.userId !== userId && role !== "ADMIN") throw new UnauthorizedException(`User with id: ${userId} is not authorized to view this chatroom`);
    return chatroom;
  }

  async closeChatroom(
    chatroomId: number,
    role: UserRole,
  ) {
    if (role !== "ADMIN") throw new UnauthorizedException("Only Admins are authorized to close chatrooms");

    try {
      const chatroom = await this.prisma.chatroom.update({
        where: {
          id: chatroomId,
        },
        data: {
          isClosed: true,
        }
      });
      return chatroom;
    } catch (error) {
      if (error.code === 'P2025') throw new NotFoundException(`Chatroom with id ${chatroomId} not found`);
      throw error;
    }
  }
}
