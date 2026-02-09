import { ProductRepository } from "../repositories/product.repository";
import { CreateProductDTO, UpdateProductDTO } from "../dtos/product.dto";
import { Types } from "mongoose";
import { ProductDocument } from "../model/product.model";
import { Category } from "../model/category.model";

export class ProductService {
  private repository = new ProductRepository();

  async addProduct(
    businessId: string,
    dto: CreateProductDTO,
    image?: string,
  ): Promise<ProductDocument> {
    const businessObjectId = new Types.ObjectId(businessId);

    const categoryExists = await Category.findById(dto.category);
    if (!categoryExists) throw new Error("Invalid category ID");

    const categoryObjectId = new Types.ObjectId(dto.category);

    const { category, ...restOfDto } = dto;

    const product = await this.repository.create({
      business: businessObjectId,
      category: categoryObjectId,
      ...restOfDto,
      discount: restOfDto.discount ?? 0,
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

  async updateProduct(
    product: ProductDocument,
    dto: UpdateProductDTO,
    image?: string,
  ): Promise<ProductDocument> {
    if (dto.category) {
      const categoryExists = await Category.findById(dto.category);
      if (!categoryExists) throw new Error("Invalid category ID");
      product.category = new Types.ObjectId(dto.category);
      delete dto.category;
    }

    Object.assign(product, dto);
    if (image) product.image = image;

    return this.repository.update(product);
  }

  async deleteProduct(productId: string): Promise<ProductDocument | null> {
    return this.repository.delete(productId);
  }
}
