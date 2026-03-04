import { Category } from "../../../../model/category.model";
import { ProductService } from "../../../../services/product.service";

jest.mock("../../../../model/category.model", () => ({
  Category: {
    findById: jest.fn(),
  },
}));

// Mock repository
jest.mock("../../../../repositories/product.repository", () => {
  const repoMock = {
    create: jest.fn(),
    findByBusiness: jest.fn(),
    findById: jest.fn(),
    findByCategory: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return {
    ProductRepository: jest.fn().mockImplementation(() => repoMock),
    __mockRepo: repoMock,
  };
});

// Import after mocks
import { ProductRepository } from "../../../../repositories/product.repository";

// Get mock objects from mocked modules
const mockProductRepoMethods = (
  jest.requireMock("../../../../repositories/product.repository") as any
).__mockRepo;
const mockCategoryFindById = Category.findById as jest.Mock;

describe("ProductService Unit Tests", () => {
  let service: ProductService;
  let repoMock: any;

  const makeProductDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "product123",
      name: overrides.name ?? "Test Product",
      description: overrides.description ?? "Test Description",
      price: overrides.price ?? 100,
      discount: overrides.discount ?? 0,
      stock: overrides.stock ?? 10,
      category: overrides.category ?? "category123",
      business: overrides.business ?? "business123",
      image: overrides.image ?? "product.jpg",
      __v: 0,
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  const makeCategoryDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "category123",
      name: overrides.name ?? "Test Category",
      description: overrides.description ?? "Category Description",
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ProductService();
    repoMock = mockProductRepoMethods;
  });

  describe("addProduct", () => {
    const businessId = "business123";
    const categoryId = "category123";

    test("should add product with image successfully", async () => {
      const dto = {
        name: "New Product",
        description: "Product Description",
        price: 199.99,
        discount: 10,
        stock: 50,
        category: categoryId,
      };

      const image = "product-image.jpg";

      const category = makeCategoryDoc({ _id: categoryId });
      mockCategoryFindById.mockResolvedValue(category);

      const createdProduct = makeProductDoc({
        _id: "product123",
        name: dto.name,
        description: dto.description,
        price: dto.price,
        discount: dto.discount,
        stock: dto.stock,
        category: categoryId,
        business: businessId,
        image,
      });

      repoMock.create.mockResolvedValue(createdProduct);

      const result = await service.addProduct(businessId, dto as any, image);

      expect(mockCategoryFindById).toHaveBeenCalledWith(categoryId);
      expect(repoMock.create).toHaveBeenCalledWith({
        ...dto,
        business: businessId,
        category: categoryId,
        discount: 10,
        image,
      });
      expect(result).toEqual(createdProduct);
    });

    test("should add product without image successfully", async () => {
      const dto = {
        name: "New Product",
        description: "Product Description",
        price: 199.99,
        discount: 10,
        stock: 50,
        category: categoryId,
      };

      const category = makeCategoryDoc({ _id: categoryId });
      mockCategoryFindById.mockResolvedValue(category);

      const createdProduct = makeProductDoc({
        _id: "product123",
        name: dto.name,
        description: dto.description,
        price: dto.price,
        discount: dto.discount,
        stock: dto.stock,
        category: categoryId,
        business: businessId,
        image: undefined,
      });

      repoMock.create.mockResolvedValue(createdProduct);

      const result = await service.addProduct(businessId, dto as any);

      expect(mockCategoryFindById).toHaveBeenCalledWith(categoryId);
      expect(repoMock.create).toHaveBeenCalledWith({
        ...dto,
        business: businessId,
        category: categoryId,
        discount: 10,
        image: undefined,
      });
      expect(result).toEqual(createdProduct);
    });

    test("should add product with default discount 0", async () => {
      const dto = {
        name: "New Product",
        description: "Product Description",
        price: 199.99,
        stock: 50,
        category: categoryId,
      };

      const category = makeCategoryDoc({ _id: categoryId });
      mockCategoryFindById.mockResolvedValue(category);

      const createdProduct = makeProductDoc({
        _id: "product123",
        name: dto.name,
        description: dto.description,
        price: dto.price,
        discount: 0,
        stock: dto.stock,
        category: categoryId,
        business: businessId,
      });

      repoMock.create.mockResolvedValue(createdProduct);

      const result = await service.addProduct(businessId, dto as any);

      expect(repoMock.create).toHaveBeenCalledWith({
        ...dto,
        business: businessId,
        category: categoryId,
        discount: 0,
        image: undefined,
      });
      expect(result).toEqual(createdProduct);
    });

    test("should throw error if category does not exist", async () => {
      const dto = {
        name: "New Product",
        description: "Product Description",
        price: 199.99,
        stock: 50,
        category: categoryId,
      };

      mockCategoryFindById.mockResolvedValue(null);

      await expect(service.addProduct(businessId, dto as any)).rejects.toThrow(
        "Invalid category ID",
      );

      expect(mockCategoryFindById).toHaveBeenCalledWith(categoryId);
      expect(repoMock.create).not.toHaveBeenCalled();
    });
  });

  describe("getBusinessProducts", () => {
    const businessId = "business123";

    test("should return all products for a business", async () => {
      const products = [
        makeProductDoc({
          _id: "product1",
          business: businessId,
          name: "Product 1",
        }),
        makeProductDoc({
          _id: "product2",
          business: businessId,
          name: "Product 2",
        }),
        makeProductDoc({
          _id: "product3",
          business: businessId,
          name: "Product 3",
        }),
      ];

      repoMock.findByBusiness.mockResolvedValue(products);

      const result = await service.getBusinessProducts(businessId);

      expect(repoMock.findByBusiness).toHaveBeenCalledWith(businessId);
      expect(result).toEqual(products);
      expect(result).toHaveLength(3);
    });

    test("should return empty array if business has no products", async () => {
      repoMock.findByBusiness.mockResolvedValue([]);

      const result = await service.getBusinessProducts(businessId);

      expect(repoMock.findByBusiness).toHaveBeenCalledWith(businessId);
      expect(result).toEqual([]);
    });
  });

  describe("getProductById", () => {
    test("should return product by id", async () => {
      const productId = "product123";
      const product = makeProductDoc({ _id: productId });

      repoMock.findById.mockResolvedValue(product);

      const result = await service.getProductById(productId);

      expect(repoMock.findById).toHaveBeenCalledWith(productId);
      expect(result).toEqual(product);
    });

    test("should return null if product not found", async () => {
      const productId = "nonexistent123";

      repoMock.findById.mockResolvedValue(null);

      const result = await service.getProductById(productId);

      expect(repoMock.findById).toHaveBeenCalledWith(productId);
      expect(result).toBeNull();
    });
  });

  describe("getProductsByCategory", () => {
    const categoryId = "category123";

    test("should return products by category", async () => {
      const category = makeCategoryDoc({ _id: categoryId });
      mockCategoryFindById.mockResolvedValue(category);

      const products = [
        makeProductDoc({
          _id: "product1",
          category: categoryId,
          name: "Product 1",
        }),
        makeProductDoc({
          _id: "product2",
          category: categoryId,
          name: "Product 2",
        }),
      ];

      repoMock.findByCategory.mockResolvedValue(products);

      const result = await service.getProductsByCategory(categoryId);

      expect(mockCategoryFindById).toHaveBeenCalledWith(categoryId);
      expect(repoMock.findByCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(products);
      expect(result).toHaveLength(2);
    });

    test("should throw error if category not found", async () => {
      mockCategoryFindById.mockResolvedValue(null);

      await expect(service.getProductsByCategory(categoryId)).rejects.toThrow(
        "Category not found",
      );

      expect(mockCategoryFindById).toHaveBeenCalledWith(categoryId);
      expect(repoMock.findByCategory).not.toHaveBeenCalled();
    });

    test("should return empty array if category has no products", async () => {
      const category = makeCategoryDoc({ _id: categoryId });
      mockCategoryFindById.mockResolvedValue(category);
      repoMock.findByCategory.mockResolvedValue([]);

      const result = await service.getProductsByCategory(categoryId);

      expect(mockCategoryFindById).toHaveBeenCalledWith(categoryId);
      expect(repoMock.findByCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual([]);
    });
  });

  describe("updateProduct", () => {
    const categoryId = "category123";
    const newCategoryId = "category456";

    test("should update product without changing category", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Original Name",
        description: "Original Description",
        price: 100,
        discount: 10,
        stock: 50,
        category: categoryId,
      });

      const dto = {
        name: "Updated Name",
        price: 150,
        stock: 30,
      };

      const updatedProduct = makeProductDoc({
        ...product,
        name: "Updated Name",
        price: 150,
        stock: 30,
      });

      repoMock.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(product as any, dto as any);

      expect(mockCategoryFindById).not.toHaveBeenCalled();
      expect(repoMock.update).toHaveBeenCalledWith(product);
      expect(product.name).toBe("Updated Name");
      expect(product.price).toBe(150);
      expect(product.stock).toBe(30);
      expect(product.description).toBe("Original Description");
      expect(product.category).toBe(categoryId);
      expect(result).toEqual(updatedProduct);
    });

    test("should update product with new category", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Original Name",
        category: categoryId,
      });

      const dto = {
        name: "Updated Name",
        category: newCategoryId,
      };

      const category = makeCategoryDoc({ _id: newCategoryId });
      mockCategoryFindById.mockResolvedValue(category);

      const updatedProduct = makeProductDoc({
        ...product,
        name: "Updated Name",
        category: newCategoryId,
      });

      repoMock.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(product as any, dto as any);

      expect(mockCategoryFindById).toHaveBeenCalledWith(newCategoryId);
      expect(repoMock.update).toHaveBeenCalledWith(product);
      expect(product.name).toBe("Updated Name");
      expect(product.category).toBe(newCategoryId);
      expect(result).toEqual(updatedProduct);
    });

    test("should update product with image", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Original Name",
        image: "old-image.jpg",
      });

      const dto = {
        name: "Updated Name",
      };

      const newImage = "new-image.jpg";

      const updatedProduct = makeProductDoc({
        ...product,
        name: "Updated Name",
        image: newImage,
      });

      repoMock.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(
        product as any,
        dto as any,
        newImage,
      );

      expect(repoMock.update).toHaveBeenCalledWith(product);
      expect(product.name).toBe("Updated Name");
      expect(product.image).toBe(newImage);
      expect(result).toEqual(updatedProduct);
    });

    test("should update product with both new category and image", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Original Name",
        category: categoryId,
        image: "old-image.jpg",
      });

      const dto = {
        name: "Updated Name",
        price: 200,
        category: newCategoryId,
      };

      const newImage = "new-image.jpg";
      const category = makeCategoryDoc({ _id: newCategoryId });
      mockCategoryFindById.mockResolvedValue(category);

      const updatedProduct = makeProductDoc({
        ...product,
        name: "Updated Name",
        price: 200,
        category: newCategoryId,
        image: newImage,
      });

      repoMock.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(
        product as any,
        dto as any,
        newImage,
      );

      expect(mockCategoryFindById).toHaveBeenCalledWith(newCategoryId);
      expect(repoMock.update).toHaveBeenCalledWith(product);
      expect(product.name).toBe("Updated Name");
      expect(product.price).toBe(200);
      expect(product.category).toBe(newCategoryId);
      expect(product.image).toBe(newImage);
      expect(result).toEqual(updatedProduct);
    });

    test("should throw error if new category does not exist", async () => {
      const product = makeProductDoc({
        _id: "product123",
        category: categoryId,
      });

      const dto = {
        category: newCategoryId,
      };

      mockCategoryFindById.mockResolvedValue(null);

      await expect(
        service.updateProduct(product as any, dto as any),
      ).rejects.toThrow("Invalid category ID");

      expect(mockCategoryFindById).toHaveBeenCalledWith(newCategoryId);
      expect(repoMock.update).not.toHaveBeenCalled();
    });

    test("should handle partial updates", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Original Name",
        description: "Original Description",
        price: 100,
        discount: 10,
        stock: 50,
      });

      const dto = {
        description: "Updated Description only",
      };

      const updatedProduct = makeProductDoc({
        ...product,
        description: "Updated Description only",
      });

      repoMock.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(product as any, dto as any);

      expect(repoMock.update).toHaveBeenCalledWith(product);
      expect(product.description).toBe("Updated Description only");
      expect(product.name).toBe("Original Name");
      expect(product.price).toBe(100);
      expect(result).toEqual(updatedProduct);
    });
  });

  describe("deleteProduct", () => {
    test("should delete product by id", async () => {
      const productId = "product123";
      const deletedProduct = makeProductDoc({ _id: productId });

      repoMock.delete.mockResolvedValue(deletedProduct);

      const result = await service.deleteProduct(productId);

      expect(repoMock.delete).toHaveBeenCalledWith(productId);
      expect(result).toEqual(deletedProduct);
    });

    test("should return null if product not found for deletion", async () => {
      const productId = "nonexistent123";

      repoMock.delete.mockResolvedValue(null);

      const result = await service.deleteProduct(productId);

      expect(repoMock.delete).toHaveBeenCalledWith(productId);
      expect(result).toBeNull();
    });
  });
});
