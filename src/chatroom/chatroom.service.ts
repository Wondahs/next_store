/* eslint-disable prettier/prettier */
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {
  constructor(private prisma: PrismaService) { }

  async findAllChatrooms(
    role: UserRole,
    userId: number
  ) {
    const chatrooms = role === UserRole.ADMIN ?
      await this.prisma.chatroom.findMany({
        include: {
          order: true,
          messages: true
        }
      }
      ) :
      await this.prisma.chatroom.findMany({
        where: { userId },
        include: {
          order: true,
          messages: true
        }
      });

    return chatrooms;
  }

  async findOneChatroom(
    role: UserRole,
    chatroomId: number,
    userId: number
  ) {
    const chatroom = await this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
      include: {
        messages: true
      }
    })
    if (!chatroom) throw new NotFoundException(`Chatroom with id ${chatroomId} not found`);
    if (chatroom.userId !== userId && role !== "ADMIN") throw new UnauthorizedException(`User with id: ${userId} is not authorized to view this chatroom`);
    return chatroom;
  }

  async closeChatroom(
    chatroomId: number,
    role: UserRole,
  ) {
    if (role !== UserRole.ADMIN) throw new UnauthorizedException("Only Admins are authorized to close chatrooms");

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

  async createMessage(
    chatroomId: number,
    userId: number,
    role: UserRole,
    message: string
  ) {
    const chatroom = await this.prisma.chatroom.findUnique({
      where: { id: chatroomId }
    });
    if (!chatroom) throw new NotFoundException(`Chatroom with id ${chatroomId} not found`);
    if (chatroom.userId !== userId && role !== UserRole.ADMIN) throw new UnauthorizedException(`User with id: ${userId} is not authorized to send messages to this chatroom`);
    if (chatroom.isClosed) throw new ConflictException(`Chatroom with id ${chatroomId} is closed`);

    return await this.prisma.message.create({
      data: {
        content: message,
        chatroomId,
        userId,
      }
    });
  }

  async getMessages(
    chatroomId: number,
    userId: number,
    role: UserRole
  ) {
    const chatroom = await this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
      include: {
        order: true,
        messages: true
      }
    });
    if (!chatroom) throw new NotFoundException(`Chatroom with id ${chatroomId} not found`);
    if (chatroom.order.userId !== userId && role !== UserRole.ADMIN) throw new UnauthorizedException(`User with id: ${userId} is not authorized to view messages in this chatroom`);
    return chatroom.messages;
  }
}
