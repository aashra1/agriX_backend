import { ProductRepository } from "../repositories/product.repository";
import { CreateProductDto, UpdateProductDto } from "../dtos/product.dto";
import { Types } from "mongoose";
import { ProductDocument } from "../model/product.model";
import { Category } from "../model/category.model";

export class ProductService {
  private repository = new ProductRepository();

  async addProduct(
    businessId: string,
    dto: CreateProductDto,
    image?: string,
  ): Promise<ProductDocument> {
    const categoryExists = await Category.findById(dto.category);
    if (!categoryExists) throw new Error("Invalid category ID");

    const product = await this.repository.create({
      ...dto,
      business: businessId as any,
      category: dto.category as any,
      discount: dto.discount ?? 0,
      image,
    });

    return product;
  }

  async getBusinessProducts(businessId: string): Promise<ProductDocument[]> {
    return this.repository.findByBusiness(businessId);
  }

  async getProductById(productId: string): Promise<ProductDocument | null> {
    return this.repository.findById(productId);
  }

  // Add this new method
  async getProductsByCategory(categoryId: string): Promise<ProductDocument[]> {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) throw new Error("Category not found");

    return this.repository.findByCategory(categoryId);
  }

  async updateProduct(
    product: ProductDocument,
    dto: UpdateProductDto,
    image?: string,
  ): Promise<ProductDocument> {
    if (dto.category) {
      const categoryExists = await Category.findById(dto.category);
      if (!categoryExists) throw new Error("Invalid category ID");

      (product as any).category = dto.category;
    }

    const { category, ...updateData } = dto;
    Object.assign(product, updateData);

    if (image) product.image = image;

    return this.repository.update(product);
  }

  async deleteProduct(productId: string): Promise<ProductDocument | null> {
    return this.repository.delete(productId);
  }
}
