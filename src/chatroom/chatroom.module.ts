/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { ChatroomController } from './chatroom.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ChatroomGateway } from './chatroom.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [PrismaModule,
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '1d' },
        }),
      })
    ],
  controllers: [ChatroomController],
  providers: [ChatroomService, PrismaService, ChatroomGateway],
})
export class ChatroomModule {}
