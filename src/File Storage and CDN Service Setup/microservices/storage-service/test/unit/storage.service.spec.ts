import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "../../src/services/storage.service";
import { S3Service } from "../../src/services/s3.service";
import { ImageOptimizationService } from "../../src/services/image-optimization.service";
import { FileValidationService } from "../../src/services/file-validation.service";
import { File, Upload, Metadata } from "../../src/entities";

describe("StorageService", () => {
  let service: StorageService;
  let fileRepository: any;
  let uploadRepository: any;
  let metadataRepository: any;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: getRepositoryToken(File),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Upload),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Metadata),
          useValue: mockRepository,
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getSignedUrl: jest.fn(),
            getBucket: jest.fn().mockReturnValue("test-bucket"),
          },
        },
        {
          provide: ImageOptimizationService,
          useValue: {
            optimizeImage: jest.fn(),
            isImage: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: FileValidationService,
          useValue: {
            validateFile: jest.fn(),
          },
        },
        {
          provide: "CONFIGURATION(storage)",
          useValue: {
            cdn: { baseUrl: "" },
            cleanup: { delayMs: 1000 },
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    fileRepository = module.get(getRepositoryToken(File));
    uploadRepository = module.get(getRepositoryToken(Upload));
    metadataRepository = module.get(getRepositoryToken(Metadata));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("listFiles", () => {
    it("should return paginated files", async () => {
      const result = await service.listFiles("user-123", "puzzle", 1, 20);

      expect(result).toHaveProperty("files");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.files)).toBe(true);
    });
  });
});
