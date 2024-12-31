/* eslint-disable prettier/prettier */
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatroomService } from './chatroom.service';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: true,
  namespace: 'chat'
})
export class ChatroomGateway {
  @WebSocketServer() server: Server;
  
  constructor(
    private chatroomService: ChatroomService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) throw new UnauthorizedException();
      
      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      const chatroomId =  parseInt(client.handshake.query.chatroomId as string);
      const chatroom = this.prisma.chatroom.findUnique({
        where: { id: chatroomId },
        include: {
          order: true,
          messages: true
        }
      })

      if (!chatroom) throw new UnauthorizedException();
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatroomId: number
  ) {
    const { sub: userId, role } = client.data.user;
    
    try {
      // Verify access using existing service
      await this.chatroomService.findOneChatroom(role, chatroomId, userId);
      client.join(`room_${chatroomId}`);
      
      // Get existing messages
      const messages = await this.chatroomService.getMessages(chatroomId, userId, role);
      return { messages };
    } catch (error) {
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatroomId: number, message: string }
  ) {
    const { sub: userId, role } = client.data.user;
    
    try {
      // Save message to DB using existing service
      const savedMessage = await this.chatroomService.createMessage(
        data.chatroomId,
        userId,
        role,
        data.message
      );
      
      // Broadcast to room
      this.server.to(`room_${data.chatroomId}`).emit('newMessage', savedMessage);
    } catch (error) {
      client.emit('error', error.message);
    }
  }
}