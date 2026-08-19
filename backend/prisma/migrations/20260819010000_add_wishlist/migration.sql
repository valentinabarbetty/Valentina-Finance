-- CreateEnum
CREATE TYPE "WishlistItemStatus" AS ENUM ('PENDING', 'PURCHASED');

-- CreateTable
CREATE TABLE "wishlist_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "wishlist_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "listId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedPrice" DECIMAL(14,2),
    "actualPrice" DECIMAL(14,2),
    "categoryId" UUID NOT NULL,
    "typeId" UUID,
    "status" "WishlistItemStatus" NOT NULL DEFAULT 'PENDING',
    "purchasedAt" DATE,
    "expenseId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlist_lists_userId_idx" ON "wishlist_lists"("userId");

-- CreateIndex
CREATE INDEX "wishlist_items_userId_idx" ON "wishlist_items"("userId");

-- CreateIndex
CREATE INDEX "wishlist_items_listId_idx" ON "wishlist_items"("listId");

-- CreateIndex
CREATE INDEX "wishlist_items_status_idx" ON "wishlist_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_expenseId_key" ON "wishlist_items"("expenseId");

-- AddForeignKey
ALTER TABLE "wishlist_lists" ADD CONSTRAINT "wishlist_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "wishlist_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "transaction_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
