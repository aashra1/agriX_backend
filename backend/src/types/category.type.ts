import { Types } from "mongoose";

export interface ICategory {
  name: string;
  description?: string;

  parentCategory?: Types.ObjectId;
}
