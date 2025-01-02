-- DropForeignKey
ALTER TABLE `chatroom` DROP FOREIGN KEY `Chatroom_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_chatroomId_fkey`;

-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `Order_userId_fkey`;

-- DropIndex
DROP INDEX `Message_chatroomId_fkey` ON `message`;

-- DropIndex
DROP INDEX `Order_userId_fkey` ON `order`;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chatroom` ADD CONSTRAINT `Chatroom_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatroomId_fkey` FOREIGN KEY (`chatroomId`) REFERENCES `Chatroom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
