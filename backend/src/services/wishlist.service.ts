import { Prisma, WishlistItemStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseDate, parseMoney } from "./transaction.service.js";

const money = (value: Prisma.Decimal | null | undefined): string | null =>
  value != null ? value.toFixed(2) : null;

const dateStr = (value: Date | null | undefined): string | null =>
  value != null ? value.toISOString().slice(0, 10) : null;

const listItemInclude = {
  category: { select: { id: true, name: true, icon: true, color: true } },
  type: { select: { id: true, name: true, kind: true, icon: true, color: true } },
  expense: { select: { id: true, amount: true, date: true } },
};

const listInclude = {
  items: {
    where: { deletedAt: null },
    include: listItemInclude,
    orderBy: { createdAt: Prisma.SortOrder.desc },
  },
};

type ListWithData = Prisma.WishlistListGetPayload<{ include: typeof listInclude }>;
type ItemWithData = Prisma.WishlistItemGetPayload<{ include: typeof listItemInclude }>;

function formatItem(item: ItemWithData) {
  return {
    ...item,
    estimatedPrice: money(item.estimatedPrice),
    actualPrice: money(item.actualPrice),
    purchasedAt: dateStr(item.purchasedAt),
    expense: item.expense
      ? { id: item.expense.id, amount: money(item.expense.amount), date: dateStr(item.expense.date) }
      : null,
  };
}

function formatList(list: ListWithData) {
  const pending = list.items.filter((i) => i.status === WishlistItemStatus.PENDING);
  const purchased = list.items.filter((i) => i.status === WishlistItemStatus.PURCHASED);
  const pendingEstimated = pending.reduce(
    (sum, i) => sum.plus(i.estimatedPrice ?? new Prisma.Decimal(0)),
    new Prisma.Decimal(0),
  );
  const purchasedTotal = purchased.reduce(
    (sum, i) => sum.plus(i.actualPrice ?? new Prisma.Decimal(0)),
    new Prisma.Decimal(0),
  );
  return {
    ...list,
    items: list.items.map(formatItem),
    pendingCount: pending.length,
    purchasedCount: purchased.length,
    pendingEstimatedTotal: money(pendingEstimated),
    purchasedTotal: money(purchasedTotal),
  };
}

export class WishlistService {
  private async assertList(userId: string, listId: string) {
    const list = await prisma.wishlistList.findFirst({
      where: { id: listId, userId, deletedAt: null },
    });
    if (!list) throw new AppError(404, "Wishlist not found");
    return list;
  }

  private async assertCategory(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw new AppError(400, "Category not found");
  }

  private async assertType(userId: string, typeId: string, categoryId: string) {
    const type = await prisma.transactionType.findFirst({
      where: { id: typeId, userId, deletedAt: null, kind: "EXPENSE" },
      select: { id: true, categoryId: true },
    });
    if (!type) throw new AppError(400, "Transaction type not found");
    if (type.categoryId !== categoryId) {
      throw new AppError(400, "Transaction type must belong to the same category");
    }
  }

  // --- Lists ---

  async createList(userId: string, input: { name: string; description?: string | null; icon?: string | null }) {
    const data: Prisma.WishlistListUncheckedCreateInput = { userId, name: input.name };
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    return prisma.wishlistList.create({ data, include: listInclude }).then(formatList);
  }

  async listLists(userId: string) {
    const lists = await prisma.wishlistList.findMany({
      where: { userId, deletedAt: null },
      include: listInclude,
      orderBy: { createdAt: "desc" },
    });
    return lists.map(formatList);
  }

  async getOneList(userId: string, id: string) {
    const list = await prisma.wishlistList.findFirst({
      where: { id, userId, deletedAt: null },
      include: listInclude,
    });
    if (!list) throw new AppError(404, "Wishlist not found");
    return formatList(list);
  }

  async updateList(userId: string, id: string, input: { name?: string; description?: string | null; icon?: string | null }) {
    await this.assertList(userId, id);
    const data: Prisma.WishlistListUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    return prisma.wishlistList.update({ where: { id }, data, include: listInclude }).then(formatList);
  }

  async removeList(userId: string, id: string): Promise<void> {
    await this.assertList(userId, id);
    await prisma.wishlistList.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Items ---

  async createItem(userId: string, listId: string, input: {
    name: string; description?: string | null; estimatedPrice?: string | null;
    categoryId: string; typeId?: string | null;
  }) {
    await this.assertList(userId, listId);
    await this.assertCategory(userId, input.categoryId);
    if (input.typeId) await this.assertType(userId, input.typeId, input.categoryId);

    const data: Prisma.WishlistItemUncheckedCreateInput = {
      userId, listId, name: input.name, categoryId: input.categoryId,
    };
    if (input.description !== undefined) data.description = input.description;
    if (input.estimatedPrice !== undefined && input.estimatedPrice !== null) {
      data.estimatedPrice = parseMoney(input.estimatedPrice);
    }
    if (input.typeId !== undefined) data.typeId = input.typeId;

    return prisma.wishlistItem.create({ data, include: listItemInclude }).then(formatItem);
  }

  async listItems(userId: string, listId: string) {
    await this.assertList(userId, listId);
    const items = await prisma.wishlistItem.findMany({
      where: { listId, userId, deletedAt: null },
      include: listItemInclude,
      orderBy: [{ createdAt: "desc" }],
    });
    return items.map(formatItem);
  }

  async getItem(userId: string, id: string) {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId, deletedAt: null },
      include: listItemInclude,
    });
    if (!item) throw new AppError(404, "Wishlist item not found");
    return formatItem(item);
  }

  async updateItem(userId: string, id: string, input: {
    name?: string; description?: string | null; estimatedPrice?: string | null;
    categoryId?: string; typeId?: string | null;
  }) {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new AppError(404, "Wishlist item not found");
    if (item.status === WishlistItemStatus.PURCHASED) {
      throw new AppError(400, "Cannot edit a purchased item");
    }

    const categoryId = input.categoryId ?? item.categoryId;
    if (input.categoryId) await this.assertCategory(userId, input.categoryId);
    if (input.typeId) await this.assertType(userId, input.typeId, categoryId);

    const data: Prisma.WishlistItemUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.estimatedPrice !== undefined) {
      data.estimatedPrice = input.estimatedPrice != null ? parseMoney(input.estimatedPrice) : null;
    }
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.typeId !== undefined) data.typeId = input.typeId;

    return prisma.wishlistItem.update({ where: { id }, data, include: listItemInclude }).then(formatItem);
  }

  async removeItem(userId: string, id: string): Promise<void> {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new AppError(404, "Wishlist item not found");
    await prisma.wishlistItem.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Purchase ---

  async purchase(userId: string, id: string, input: {
    actualPrice: string; date: string; categoryId: string; typeId?: string | null;
  }) {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new AppError(404, "Wishlist item not found");
    if (item.status === WishlistItemStatus.PURCHASED) {
      throw new AppError(400, "This item is already purchased");
    }

    await this.assertCategory(userId, input.categoryId);
    if (input.typeId) await this.assertType(userId, input.typeId, input.categoryId);

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          userId,
          categoryId: input.categoryId,
          typeId: input.typeId ?? null,
          amount: parseMoney(input.actualPrice),
          date: parseDate(input.date),
          description: item.name,
        },
      });

      const updated = await tx.wishlistItem.update({
        where: { id },
        data: {
          status: WishlistItemStatus.PURCHASED,
          actualPrice: parseMoney(input.actualPrice),
          purchasedAt: parseDate(input.date),
          categoryId: input.categoryId,
          typeId: input.typeId ?? null,
          expenseId: expense.id,
        },
        include: listItemInclude,
      });

      return formatItem(updated);
    });

    return result;
  }

  // --- Dashboard summary ---

  async summary(userId: string) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId, deletedAt: null, status: WishlistItemStatus.PENDING },
      select: { estimatedPrice: true },
    });

    const pendingCount = items.length;
    const pendingEstimatedTotal = items.reduce(
      (sum, i) => sum.plus(i.estimatedPrice ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );

    return {
      pendingCount,
      pendingEstimatedTotal: money(pendingEstimatedTotal),
    };
  }
}

export const wishlistService = new WishlistService();
