import { CartRepository } from "../repositories/cart.repository";
import { ProductRepository } from "../repositories/product.repository";
import { AddToCartDto, UpdateCartItemDto } from "../dtos/cart.dto";
import { CartDocument } from "../model/cart.model";

export class CartService {
  private cartRepository = new CartRepository();
  private productRepository = new ProductRepository();

  async getCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartRepository.findByUser(userId);
    if (!cart) {
      return this.cartRepository.create(userId);
    }
    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartDocument> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stock < dto.quantity) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }

    let cart = await this.cartRepository.findByUser(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    const existingItemIndex = cart.items.findIndex((item) => {
      const id = (item.product as any)._id || item.product;
      return id.toString() === dto.productId;
    });

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += dto.quantity;
    } else {
      const cartItem = {
        product: product._id,
        quantity: dto.quantity,
        price: product.price,
        discount: product.discount || 0,
        business: product.business,
        name: product.name,
        image: product.image,
      };
      cart.items.push(cartItem as any);
    }

    return cart.save();
  }

  async updateCartItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const cart = await this.cartRepository.findByUser(userId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    const existingItem = cart.items.find((item) => {
      const id = (item.product as any)._id || item.product;
      return id.toString() === productId;
    });

    if (!existingItem) {
      throw new Error("Item not found in cart");
    }

    if (dto.quantity > existingItem.quantity) {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const additionalQuantity = dto.quantity - existingItem.quantity;
      if (product.stock < additionalQuantity) {
        throw new Error(`Only ${product.stock} items available in stock`);
      }
    }

    return this.cartRepository.updateItemQuantity(
      cart,
      productId,
      dto.quantity,
    );
  }

  async removeFromCart(
    userId: string,
    productId: string,
  ): Promise<CartDocument> {
    const cart = await this.cartRepository.findByUser(userId);
    if (!cart) {
      throw new Error("Cart not found");
    }
    return this.cartRepository.removeItem(cart, productId);
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartRepository.findByUser(userId);
    if (!cart) {
      throw new Error("Cart not found");
    }
    return this.cartRepository.clearCart(cart);
  }

  async getCartCount(userId: string): Promise<number> {
    const cart = await this.cartRepository.findByUser(userId);
    return cart?.totalItems || 0;
  }
}
