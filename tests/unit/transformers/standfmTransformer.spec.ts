import { describe, expect, it, vi, beforeEach } from "vitest";
import { transformStandfmUrl } from "../../../src/_data/transformers/standfmTransformer.js";

const { warnSpy } = vi.hoisted(() => ({
  warnSpy: vi.fn(),
}));

vi.mock("../../../src/lib/logger.js", () => ({
  getLogger: () => ({
    warn: warnSpy,
  }),
}));

describe("transformStandfmUrl", () => {
  beforeEach(() => {
    warnSpy.mockClear();
  });

  it("returns iframe embed for valid episode URLs", () => {
    const url = "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6";
    const embed = transformStandfmUrl(url);
    expect(embed).toContain('src="https://stand.fm/embed/episodes/68bd9ce07e45afd2f3e1d6e6"');
    expect(embed).toContain('class="standfm-embed-iframe"');
  });

  it("logs warning and returns null for invalid URLs", () => {
    const url = "https://stand.fm/channels/invalid";
    expect(transformStandfmUrl(url)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid Stand.fm URL format", { url });
  });

  it("returns null when url is missing", () => {
    expect(transformStandfmUrl(null)).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
