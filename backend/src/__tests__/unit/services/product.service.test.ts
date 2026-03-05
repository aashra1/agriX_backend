import { ProductService } from "../../../services/product.service";
import { ProductRepository } from "../../../repositories/product.repository";
import { Category } from "../../../model/category.model";

jest.mock("../../../repositories/product.repository");
jest.mock("../../../model/category.model");

describe("ProductService", () => {
  let service: ProductService;
  let mockProductRepository: jest.Mocked<ProductRepository>;

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
      toObject: function () {
        return { ...base, ...overrides };
      },
    };
    return base;
  };

  const makeCategoryDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "category123",
      name: overrides.name ?? "Test Category",
      description: overrides.description ?? "Category Description",
    };
    return base;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
    mockProductRepository =
      new ProductRepository() as jest.Mocked<ProductRepository>;

    mockProductRepository.create = jest.fn();
    mockProductRepository.findByBusiness = jest.fn();
    mockProductRepository.findById = jest.fn();
    mockProductRepository.findByCategory = jest.fn();
    mockProductRepository.update = jest.fn();
    mockProductRepository.delete = jest.fn();

    (service as any).repository = mockProductRepository;
  });

  describe("addProduct", () => {
    const businessId = "business123";
    const categoryId = "category123";

    test("should add product with image", async () => {
      const dto = {
        name: "New Product",
        description: "Desc",
        price: 199.99,
        discount: 10,
        stock: 50,
        category: categoryId,
      };
      const image = "product-image.jpg";
      const category = makeCategoryDoc({ _id: categoryId });
      (Category.findById as jest.Mock).mockResolvedValue(category);

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

      mockProductRepository.create.mockResolvedValue(createdProduct as any);

      const result = await service.addProduct(businessId, dto as any, image);

      expect(Category.findById).toHaveBeenCalledWith(categoryId);
      expect(mockProductRepository.create).toHaveBeenCalledWith({
        ...dto,
        business: businessId,
        category: categoryId,
        discount: 10,
        image,
      });
      expect(result).toEqual(createdProduct);
    });

    test("should add product without image", async () => {
      const dto = {
        name: "New Product",
        description: "Desc",
        price: 199.99,
        discount: 10,
        stock: 50,
        category: categoryId,
      };
      const category = makeCategoryDoc({ _id: categoryId });
      (Category.findById as jest.Mock).mockResolvedValue(category);

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

      mockProductRepository.create.mockResolvedValue(createdProduct as any);

      const result = await service.addProduct(businessId, dto as any);

      expect(mockProductRepository.create).toHaveBeenCalledWith({
        ...dto,
        business: businessId,
        category: categoryId,
        discount: 10,
        image: undefined,
      });
      expect(result).toEqual(createdProduct);
    });

    test("should throw if category not found", async () => {
      const dto = {
        name: "New Product",
        category: categoryId,
        price: 100,
        stock: 10,
      };
      (Category.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.addProduct(businessId, dto as any)).rejects.toThrow(
        "Invalid category ID",
      );
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getBusinessProducts", () => {
    test("should return business products", async () => {
      const products = [
        makeProductDoc({ _id: "product1" }),
        makeProductDoc({ _id: "product2" }),
      ];
      mockProductRepository.findByBusiness.mockResolvedValue(products as any);

      const result = await service.getBusinessProducts("business123");

      expect(mockProductRepository.findByBusiness).toHaveBeenCalledWith(
        "business123",
      );
      expect(result).toEqual(products);
    });

    test("should return empty array if no products", async () => {
      mockProductRepository.findByBusiness.mockResolvedValue([]);

      const result = await service.getBusinessProducts("business123");

      expect(result).toEqual([]);
    });
  });

  describe("getProductById", () => {
    test("should return product by id", async () => {
      const product = makeProductDoc({ _id: "product123" });
      mockProductRepository.findById.mockResolvedValue(product as any);

      const result = await service.getProductById("product123");

      expect(mockProductRepository.findById).toHaveBeenCalledWith("product123");
      expect(result).toEqual(product);
    });

    test("should return null if not found", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await service.getProductById("product123");

      expect(result).toBeNull();
    });
  });

  describe("getProductsByCategory", () => {
    const categoryId = "category123";

    test("should return products by category", async () => {
      const category = makeCategoryDoc({ _id: categoryId });
      (Category.findById as jest.Mock).mockResolvedValue(category);

      const products = [makeProductDoc({ _id: "product1" })];
      mockProductRepository.findByCategory.mockResolvedValue(products as any);

      const result = await service.getProductsByCategory(categoryId);

      expect(Category.findById).toHaveBeenCalledWith(categoryId);
      expect(mockProductRepository.findByCategory).toHaveBeenCalledWith(
        categoryId,
      );
      expect(result).toEqual(products);
    });

    test("should throw if category not found", async () => {
      (Category.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getProductsByCategory(categoryId)).rejects.toThrow(
        "Category not found",
      );
      expect(mockProductRepository.findByCategory).not.toHaveBeenCalled();
    });
  });

  describe("updateProduct", () => {
    const categoryId = "category123";
    const newCategoryId = "category456";

    test("should update product without changing category", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Old",
        category: categoryId,
      });
      const dto = { name: "Updated", price: 150 };
      const updatedProduct = makeProductDoc({
        ...product,
        name: "Updated",
        price: 150,
      });

      mockProductRepository.update.mockResolvedValue(updatedProduct as any);

      const result = await service.updateProduct(product as any, dto as any);

      expect(Category.findById).not.toHaveBeenCalled();
      expect(mockProductRepository.update).toHaveBeenCalledWith(product);
      expect(result).toEqual(updatedProduct);
    });

    test("should update with new category", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Test Product",
        category: categoryId,
      });
      const dto = { category: newCategoryId };
      const category = makeCategoryDoc({ _id: newCategoryId });
      (Category.findById as jest.Mock).mockResolvedValue(category);

      const updatedProduct = makeProductDoc({
        ...product,
        category: newCategoryId,
      });
      mockProductRepository.update.mockResolvedValue(updatedProduct as any);

      const result = await service.updateProduct(product as any, dto as any);

      expect(Category.findById).toHaveBeenCalledWith(newCategoryId);
      expect(mockProductRepository.update).toHaveBeenCalledWith(product);
      expect(result).toEqual(updatedProduct);
    });

    test("should update with image", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Test Product",
        image: "old.jpg",
      });
      const dto = { name: "Updated" };
      const newImage = "new.jpg";
      const updatedProduct = makeProductDoc({
        ...product,
        name: "Updated",
        image: newImage,
      });

      mockProductRepository.update.mockResolvedValue(updatedProduct as any);

      const result = await service.updateProduct(
        product as any,
        dto as any,
        newImage,
      );

      expect(mockProductRepository.update).toHaveBeenCalledWith(product);
      expect(result).toEqual(updatedProduct);
    });

    test("should throw if new category not found", async () => {
      const product = makeProductDoc({
        _id: "product123",
        category: categoryId,
      });
      const dto = { category: newCategoryId };
      (Category.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProduct(product as any, dto as any),
      ).rejects.toThrow("Invalid category ID");
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });

    test("should handle partial updates", async () => {
      const product = makeProductDoc({
        _id: "product123",
        name: "Test Product",
        price: 100,
        stock: 10,
      });
      const dto = { price: 200 };
      const updatedProduct = makeProductDoc({
        ...product,
        price: 200,
      });

      mockProductRepository.update.mockResolvedValue(updatedProduct as any);

      const result = await service.updateProduct(product as any, dto as any);

      expect(mockProductRepository.update).toHaveBeenCalledWith(product);
      expect(result).toEqual(updatedProduct);
    });
  });

  describe("deleteProduct", () => {
    test("should delete product", async () => {
      const deletedProduct = makeProductDoc({ _id: "product123" });
      mockProductRepository.delete.mockResolvedValue(deletedProduct as any);

      const result = await service.deleteProduct("product123");

      expect(mockProductRepository.delete).toHaveBeenCalledWith("product123");
      expect(result).toEqual(deletedProduct);
    });

    test("should return null if not found", async () => {
      mockProductRepository.delete.mockResolvedValue(null);

      const result = await service.deleteProduct("product123");

      expect(result).toBeNull();
    });
  });
});
