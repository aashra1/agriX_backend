import { Cart, CartDocument } from "../model/cart.model";

export class CartRepository {
  async findByUser(userId: string): Promise<CartDocument | null> {
    return Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        populate: [
          { path: "category", select: "name" },
          { path: "business", select: "businessName" },
        ],
      })
      .populate("items.business", "businessName");
  }

  async create(userId: string): Promise<CartDocument> {
    return Cart.create({
      user: userId,
      items: [],
      totalAmount: 0,
      totalItems: 0,
    });
  }

  async updateItemQuantity(
    cart: CartDocument,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    const itemIndex = cart.items.findIndex((i) => {
      const id = (i.product as any)._id || i.product;
      return id.toString() === productId;
    });

    if (itemIndex === -1) {
      throw new Error("Item not found in cart");
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    return cart.save();
  }

  async removeItem(
    cart: CartDocument,
    productId: string,
  ): Promise<CartDocument> {
    cart.items = cart.items.filter((i) => {
      const id = (i.product as any)._id || i.product;
      return id.toString() !== productId;
    });
    return cart.save();
  }

  async clearCart(cart: CartDocument): Promise<CartDocument> {
    cart.items = [];
    return cart.save();
  }
}
