/* eslint-disable prettier/prettier */
import { Chatroom, OrderStatus, User } from "@prisma/client";

export class Order {
    id: number;
    description: string;
    specifications: Record<string, any>;
    quantity: number;
    status: OrderStatus;
    user: User;
    userId: number;
    chatroom?: Chatroom;
    createdAt: Date;
    updatedAt: Date;
}
