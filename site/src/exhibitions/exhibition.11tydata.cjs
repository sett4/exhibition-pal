module.exports = {
  eleventyComputed: {
    permalink: (data) => {
      const slug = data.exhibition?.slug || data.exhibition?.id;
      return `/exhibitions/${slug}/index.html`;
    },
    pageDescription: (data) => data.exhibition?.summary || data.metadata?.defaultDescription,
    ogImage: (data) => data.exhibition?.heroImage?.src || data.metadata?.defaultOgImage
  }
};
