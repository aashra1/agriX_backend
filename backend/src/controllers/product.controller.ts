import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export const addProduct = async (req: Request, res: Response) => {
  try {
    const businessId = req.user!.id;
    const { name, category, price, stock } = req.body;

    if (!name || !category || !price || !stock) {
      return res.status(400).json({
        success: false,
        message: "Name, category, price and stock are required.",
      });
    }

    const product = await productService.addProduct(
      businessId,
      req.body,
      req.file?.path,
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      product,
    });
  } catch (error: any) {
    console.error("Add Product Error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

export const getBusinessProducts = async (req: Request, res: Response) => {
  const products = await productService.getBusinessProducts(req.user!.id);
  res.json({ success: true, count: products.length, products });
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });

  res.json({ success: true, product });
};

export const updateProduct = async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });

  if (product.business.toString() !== req.user!.id) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const updated = await productService.updateProduct(
    product,
    req.body,
    req.file?.path,
  );

  res.json({ success: true, message: "Product updated", product: updated });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });

  if (product.business.toString() !== req.user!.id) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  await productService.deleteProduct(req.params.id);
  res.json({ success: true, message: "Product deleted successfully" });
};
