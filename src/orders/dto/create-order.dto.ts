/* eslint-disable prettier/prettier */
import { IsJSON, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsJSON()
    @IsNotEmpty()
    specifications: Record<string, any>;
}
