import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { AddToCartDto, UpdateCartItemDto } from "../dtos/cart.dto";

const cartService = new CartService();

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await cartService.getCart(userId);
    res.json({ success: true, cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity } = req.body;
    const validatedData = AddToCartDto.parse({ productId, quantity });
    const cart = await cartService.addToCart(userId, validatedData);
    res.status(200).json({ success: true, cart });
  } catch (error: any) {
    res.status(error.name === "ZodError" ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    const validatedData = UpdateCartItemDto.parse({ quantity });
    const cart = await cartService.updateCartItem(
      userId,
      productId,
      validatedData,
    );
    res.json({ success: true, cart });
  } catch (error: any) {
    const status = error.message === "Item not found in cart" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;
    const cart = await cartService.removeFromCart(userId, productId);
    res.json({ success: true, cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await cartService.clearCart(userId);
    res.json({ success: true, cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCartCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await cartService.getCartCount(userId);
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
