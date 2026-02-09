import { Types } from "mongoose";
import { Category, CategoryDocument } from "../model/category.model";
import { ICategory } from "../types/category.type";

export class CategoryRepository {
  async create(
    data: Omit<ICategory, "parentCategory"> & {
      parentCategory?: Types.ObjectId;
    },
  ) {
    return Category.create(data);
  }

  async findById(categoryId: string) {
    return Category.findById(categoryId);
  }

  async findAll() {
    return Category.find({});
  }

  async update(categoryDoc: CategoryDocument) {
    return categoryDoc.save();
  }

  async delete(categoryId: string) {
    return Category.findByIdAndDelete(categoryId);
  }
}
