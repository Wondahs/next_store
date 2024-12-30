/* eslint-disable prettier/prettier */
import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards, Post, Body } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { User } from 'src/auth/user.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('chatroom')
@UseGuards(JwtAuthGuard)
export class ChatroomController {
  constructor(private readonly chatroomService: ChatroomService) {}

  @Get()
  findAll(
    @User('role') role: UserRole
  ) {
    return this.chatroomService.findAllChatrooms(role);
  }

  @Get(':chatroomId')
  findOneChat(
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @User('role') role: UserRole,
    @User('id') userId: number
  ) {
    return this.chatroomService.findOneChatroom(role, chatroomId, userId);
  }

  @Patch(':chatroomId/close')
  closeChatroom(
    @Param('chatroomId', ParseIntPipe) chatroomId: number, 
    @User('role') role: UserRole) {
    return this.chatroomService.closeChatroom(chatroomId, role);
  }

  @Post(':chatroomId/create-message')
  createMassage(
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @User('id') userId: number,
    @Body('message') message: string
  ) {
    return this.chatroomService.createMessage(chatroomId, userId, message);
  }

  @Get(':chatroomId/messages')
  getMessages(
    @Param('chatroomId', ParseIntPipe) chatroomId: number
  ) {
    return this.chatroomService.getMessages(chatroomId);
  }
}
