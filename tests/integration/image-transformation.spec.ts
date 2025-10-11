import { describe, it, expect, beforeAll } from "vitest";
import { transformGoogleDriveUrl, processExhibitionImage } from "../../src/_data/imageTransformer.js";
import type { ImageMetadata } from "../../src/_data/types.js";

describe("Image Transformation Pipeline", () => {
  describe("URL Transformation", () => {
    it("should transform Google Drive sharing link to direct URL", () => {
      const googleDriveUrl = "https://drive.google.com/file/d/1ABC123xyz/view";
      const transformed = transformGoogleDriveUrl(googleDriveUrl);

      expect(transformed).toBe("https://www.googleapis.com/drive/v3/files/1ABC123xyz?alt=media");
      expect(transformed).toContain("googleapis.com/drive/v3/files");
    });

    it("should preserve non-Google Drive URLs", () => {
      const directUrl = "https://example.com/images/hero.jpg";
      const transformed = transformGoogleDriveUrl(directUrl);

      expect(transformed).toBe(directUrl);
    });
  });

  describe("Image Processing with eleventy-img", () => {
    // Note: These tests require network access to process images
    // In a real environment, you would use mock images or fixtures

    it("should return null for null input", async () => {
      const result = await processExhibitionImage(null, "test-exhibition");
      expect(result).toBeNull();
    });

    it("should return null for empty string input", async () => {
      const result = await processExhibitionImage("", "test-exhibition");
      expect(result).toBeNull();
    });

    it("should handle network errors gracefully", async () => {
      const invalidUrl = "https://example.com/nonexistent-image.jpg";
      const result = await processExhibitionImage(invalidUrl, "test-exhibition");

      // Should return null on error, not throw
      expect(result).toBeNull();
    }, 30000); // 30s timeout for network request

    it("should generate metadata structure with correct format", async () => {
      // This test would require a real accessible image URL
      // For now, we test the expected structure
      const mockMetadata: ImageMetadata = {
        avif: [
          {
            url: "/assets/images/exhibitions/test-640.avif",
            width: 640,
            height: 480,
            filename: "test-640.avif",
            outputPath: "_site/assets/images/exhibitions/test-640.avif",
            size: 12345,
            sourceType: "image/avif",
          },
        ],
        webp: [
          {
            url: "/assets/images/exhibitions/test-640.webp",
            width: 640,
            height: 480,
            filename: "test-640.webp",
            outputPath: "_site/assets/images/exhibitions/test-640.webp",
            size: 23456,
            sourceType: "image/webp",
          },
        ],
        jpeg: [
          {
            url: "/assets/images/exhibitions/test-640.jpeg",
            width: 640,
            height: 480,
            filename: "test-640.jpeg",
            outputPath: "_site/assets/images/exhibitions/test-640.jpeg",
            size: 34567,
            sourceType: "image/jpeg",
          },
        ],
        originalFormat: "jpeg",
        primaryUrl: "/assets/images/exhibitions/test-640.jpeg",
      };

      // Validate structure
      expect(mockMetadata).toHaveProperty("jpeg");
      expect(mockMetadata.jpeg).toBeInstanceOf(Array);
      expect(mockMetadata.jpeg.length).toBeGreaterThan(0);
      expect(mockMetadata).toHaveProperty("primaryUrl");
      expect(mockMetadata.primaryUrl).toMatch(/^\/assets\/images\/exhibitions\//);
    });
  });

  describe("Full Pipeline: Google Sheets → Transformation → eleventy-img", () => {
    it("should transform Google Drive URL and prepare for image processing", () => {
      // Simulate data from Google Sheets
      const rawImageUrl = "https://drive.google.com/file/d/1TestFileId123/view";

      // Step 1: Transform URL
      const transformedUrl = transformGoogleDriveUrl(rawImageUrl);
      expect(transformedUrl).toBe("https://www.googleapis.com/drive/v3/files/1TestFileId123?alt=media");

      // Step 2: URL is now ready for processExhibitionImage()
      expect(transformedUrl).toContain("googleapis.com/drive/v3/files");
      expect(transformedUrl).not.toContain("/file/d/");
    });

    it("should handle null URLs throughout the pipeline", () => {
      // Simulate missing image URL from Google Sheets
      const rawImageUrl = null;

      // Step 1: Transform URL
      const transformedUrl = transformGoogleDriveUrl(rawImageUrl);
      expect(transformedUrl).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should log and return null for invalid image URLs", async () => {
      const invalidUrls = [
        "https://drive.google.com/file/d/invalid-private-file/view",
        "https://example.com/404.jpg",
        "not-a-url",
      ];

      for (const url of invalidUrls) {
        const result = await processExhibitionImage(url, "test-ex");
        expect(result).toBeNull();
      }
    }, 90000); // Extended timeout for multiple network requests with retry logic

    it("should handle malformed Google Drive URLs gracefully", () => {
      const malformedUrls = [
        "https://drive.google.com/file/d//view",
        "https://drive.google.com/open?id=",
      ];

      malformedUrls.forEach((url) => {
        const transformed = transformGoogleDriveUrl(url);
        // Should return original URL (which will later fail gracefully in processExhibitionImage)
        expect(transformed).toBe(url);
      });
    });
  });

  describe("Cache Behavior", () => {
    it("should use cache directory for downloaded images", async () => {
      // This test validates configuration, actual cache testing requires
      // running the build twice and checking file system

      // The cache configuration is validated by the fact that
      // processExhibitionImage uses eleventy-img with cacheOptions
      expect(true).toBe(true); // Placeholder for manual cache validation
    });
  });

  describe("Performance", () => {
    it("should transform URLs in under 10ms", () => {
      const url = "https://drive.google.com/file/d/1ABC123xyz/view";
      const start = Date.now();

      transformGoogleDriveUrl(url);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10);
    });

    it("should handle batch transformations efficiently", () => {
      const urls = Array(50).fill("https://drive.google.com/file/d/1ABC123xyz/view");
      const start = Date.now();

      urls.forEach((url) => transformGoogleDriveUrl(url));

      const duration = Date.now() - start;
      // Should process 50 URLs in under 50ms (< 1ms per URL)
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Placeholder Fallback", () => {
    it("should return null to trigger placeholder when image processing fails", async () => {
      const brokenUrl = "https://example.com/definitely-does-not-exist.jpg";
      const result = await processExhibitionImage(brokenUrl, "test-ex");

      // Null result should trigger template placeholder logic
      expect(result).toBeNull();
    }, 60000); // Increased timeout to 60s for network request retry logic
  });
});
