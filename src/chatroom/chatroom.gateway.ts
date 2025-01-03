/* eslint-disable prettier/prettier */
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatroomService } from './chatroom.service';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@WebSocketGateway({
  cors: true,
  namespace: 'chat'
})
export class ChatroomGateway {
  @WebSocketServer() server: Server;
  chatroomId: number

  constructor(
    private chatroomService: ChatroomService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) { }

  async handleConnection(client: Socket) {
    try {
      // Get chatroom using chatroomid parameter
      this.chatroomId = parseInt(client.handshake.query.chatroomId as string);
      if (!this.chatroomId) {
        throw new Error("chatroomid missing")
      }
      const chatroom = await this.prisma.chatroom.findUnique({
        where: { id: this.chatroomId },
        include: {
          messages: true,
          user: true,
        }
      })
      // console.log(chatroom);
      if (!chatroom) throw new UnauthorizedException(`Chatroom with id ${this.chatroomId} does not exist`);
      
      // Check for auth token
      // console.log(client.handshake);
      const authToken = client.handshake.headers.auth as string || client.handshake.headers.authorization as string;
      const token = authToken ? authToken.split(' ')[1] : "";
      if (!token) {
        console.log('No token found');
        throw new UnauthorizedException("No or invalid token");
      }

      // Verify token and get userId
      const payload = this.jwtService.verify(token);
      // console.log(payload);
      client.data.user = payload;
      const userId = payload.sub;
      // console.log(chatroom.user);

      // check if user has access to room
      if (payload.role !== UserRole.ADMIN && userId !== chatroom.userId) throw new UnauthorizedException("You are not authorized to view this room");
    } catch(error) {
      client.emit("error", error.message);
      client.disconnect();
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string }
  ) {
    const { sub: userId, role } = client.data.user;
    const msgBody = data.message || data
    console.log("Data: ", data.message);
    try {
      // Save message to DB using existing service
      const savedMessage = await this.chatroomService.createMessage(
        this.chatroomId,
        userId,
        role,
        msgBody as string
      );

      // Broadcast to room
      client.broadcast.emit('sendMessage', msgBody);
    } catch (error) {
      client.emit('error', error.message);
    }
  }
}