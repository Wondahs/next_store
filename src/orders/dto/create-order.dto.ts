/* eslint-disable prettier/prettier */
import { OrderStatus } from "@prisma/client";
import { IsEnum, IsJSON, IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsObject()
    @IsNotEmpty()
    specifications: Record<string, any>;

    @IsEnum(OrderStatus)
    @IsNotEmpty()
    status: OrderStatus;
}
