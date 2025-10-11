import { describe, it, expect } from "vitest";
import { transformGoogleDriveUrl } from "../../src/_data/imageTransformer.js";

describe("transformGoogleDriveUrl", () => {
  describe("Google Drive URL transformation", () => {
    it("should transform /file/d/ format URL", () => {
      const input = "https://drive.google.com/file/d/1ABC123xyz_-/view";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe("https://www.googleapis.com/drive/v3/files/1ABC123xyz_-?alt=media");
    });

    it("should transform /file/d/ format URL with additional query params", () => {
      const input = "https://drive.google.com/file/d/1ABC123xyz_-/view?usp=sharing";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe("https://www.googleapis.com/drive/v3/files/1ABC123xyz_-?alt=media");
    });

    it("should transform /open?id= format URL", () => {
      const input = "https://drive.google.com/open?id=1XYZ789abc_-";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe("https://www.googleapis.com/drive/v3/files/1XYZ789abc_-?alt=media");
    });

    it("should transform /uc?id= format URL to normalized format", () => {
      const input = "https://drive.google.com/uc?id=1DEF456ghi_-";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe("https://www.googleapis.com/drive/v3/files/1DEF456ghi_-?alt=media");
    });

    it("should handle file IDs with various valid characters", () => {
      const fileIds = [
        "1234567890abcdefghijklmnop",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a-b_c-d_e",
        "1234567890123456789012345678901234567890", // 40 chars
      ];

      fileIds.forEach((fileId) => {
        const input = `https://drive.google.com/file/d/${fileId}/view`;
        const output = transformGoogleDriveUrl(input);
        expect(output).toBe(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
      });
    });
  });

  describe("Non-Google Drive URLs", () => {
    it("should pass through non-Google Drive HTTPS URLs unchanged", () => {
      const input = "https://example.com/image.jpg";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe(input);
    });

    it("should pass through direct image URLs unchanged", () => {
      const urls = [
        "https://images.example.com/photo.jpg",
        "https://cdn.example.com/assets/image.png",
        "https://example.com/path/to/image.webp",
      ];

      urls.forEach((url) => {
        const output = transformGoogleDriveUrl(url);
        expect(output).toBe(url);
      });
    });

    it("should pass through HTTP URLs unchanged", () => {
      const input = "http://example.com/image.jpg";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe(input);
    });
  });

  describe("Invalid and edge case inputs", () => {
    it("should return null for null input", () => {
      const output = transformGoogleDriveUrl(null);
      expect(output).toBeNull();
    });

    it("should return empty string unchanged", () => {
      const output = transformGoogleDriveUrl("");
      expect(output).toBe(""); // Returns as-is
    });

    it("should handle edge cases in malformed Google Drive URLs", () => {
      // Empty file ID - doesn't match pattern
      const url1 = "https://drive.google.com/file/d//view";
      const output1 = transformGoogleDriveUrl(url1);
      expect(output1).toBe(url1); // Returns original (no match)

      // "view" is captured as file ID (matches /file/d/{ID}/ pattern)
      const url2 = "https://drive.google.com/file/d/view";
      const output2 = transformGoogleDriveUrl(url2);
      // Pattern matches "view" as file ID, transforms
      expect(output2).toBe("https://www.googleapis.com/drive/v3/files/view?alt=media");

      // Empty ID parameter - doesn't match pattern
      const url3 = "https://drive.google.com/open?id=";
      const output3 = transformGoogleDriveUrl(url3);
      expect(output3).toBe(url3); // Returns original (no match)
    });

    it("should handle whitespace-only input", () => {
      const input = "   ";
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe(input);
    });

    it("should handle file IDs with minimum length (28 chars)", () => {
      const fileId = "a".repeat(28);
      const input = `https://drive.google.com/file/d/${fileId}/view`;
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    });

    it("should handle file IDs with maximum length (44 chars)", () => {
      const fileId = "a".repeat(44);
      const input = `https://drive.google.com/file/d/${fileId}/view`;
      const output = transformGoogleDriveUrl(input);
      expect(output).toBe(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    });

    it("should handle file ID that is too short (< 28 chars)", () => {
      const fileId = "short";
      const input = `https://drive.google.com/file/d/${fileId}/view`;
      const output = transformGoogleDriveUrl(input);
      // Should still transform since we're using flexible regex
      expect(output).toBe(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    });
  });
});
