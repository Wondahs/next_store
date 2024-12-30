/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";

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
}
