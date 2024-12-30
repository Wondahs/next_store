/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * This is a custom decorator to extract user information from the request object.
 *
 * @param data - Optional parameter to specify a particular property of the user object to retrieve.
 * @param ctx - Execution context that provides access to the request object.
 * @returns The full user object or a specific property of the user object if `data` is provided.
 */
export const User = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    }
)