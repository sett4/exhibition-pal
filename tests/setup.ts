import { vi } from 'vitest';

vi.mock('@11ty/eleventy-img', () => {
  return {
    default: async function mockEleventyImg(_source, options = {}) {
      const urlPath = options.urlPath ?? '/img/hero/mock/';
      return {
        webp: [
          {
            width: 1600,
            height: 900,
            format: 'webp',
            url: `${urlPath}mock-1600.webp`,
            size: 320000
          }
        ],
        jpeg: [
          {
            width: 800,
            height: 450,
            format: 'jpeg',
            url: `${urlPath}mock-800.jpeg`,
            size: 180000
          }
        ]
      };
    }
  };
});
process.env.TEST_HERO_IMAGE_FIXTURE = 'mock';
