import { Types } from "mongoose";
import { CategoryRepository } from "../repositories/category.repository";
import { CreateCategoryDTO, UpdateCategoryDTO } from "../dtos/category.dto";
import { CategoryDocument } from "../model/category.model";

export class CategoryService {
  private repository = new CategoryRepository();

  async addCategory(dto: CreateCategoryDTO) {
    let parentObjectId: Types.ObjectId | undefined;
    if (dto.parentCategory) {
      parentObjectId = new Types.ObjectId(dto.parentCategory);
    }

    return this.repository.create({
      name: dto.name,
      description: dto.description,
      parentCategory: parentObjectId,
    });
  }

  getCategories() {
    return this.repository.findAll();
  }

  getCategoryById(categoryId: string) {
    return this.repository.findById(categoryId);
  }

  async updateCategory(categoryDoc: CategoryDocument, dto: UpdateCategoryDTO) {
    if (dto.parentCategory) {
      categoryDoc.parentCategory = new Types.ObjectId(dto.parentCategory);
      delete dto.parentCategory;
    }

    Object.assign(categoryDoc, dto);

    return this.repository.update(categoryDoc);
  }

  deleteCategory(categoryId: string) {
    return this.repository.delete(categoryId);
  }
}
