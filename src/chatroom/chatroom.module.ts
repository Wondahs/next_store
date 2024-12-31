import { Module } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { ChatroomController } from './chatroom.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatroomGateway } from './chatroom.gateway';

@Module({
  controllers: [ChatroomController],
  providers: [ChatroomService, PrismaService, ChatroomGateway],
})
export class ChatroomModule {}
