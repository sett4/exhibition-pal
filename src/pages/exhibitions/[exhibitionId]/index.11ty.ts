import type { Exhibition } from '../../../data/types.js';

interface DetailRenderContext {
  exhibition: Exhibition;
  navigation: Exhibition[];
}

export default class ExhibitionDetailTemplate {
  data() {
    return {
      permalink: (data: DetailRenderContext) => `exhibitions/${data.exhibition.id}/index.html`,
      layout: 'layouts/base.njk',
    };
  }

  render({ exhibition, navigation }: DetailRenderContext): string {
    const relatedLinks = exhibition.relatedUrls
      .map((url) => `<li><a href="${url}" rel="noopener" target="_blank">関連リンク</a></li>`)
      .join('');

    const standfmSection = exhibition.standfmUrl
      ? `<section class="standfm-section"><h2>stand.fm</h2><a href="${exhibition.standfmUrl}" rel="noopener" target="_blank">音声で聴く</a></section>`
      : '';

    const artworkLink = exhibition.artworkListDriveUrl
      ? `<a href="${exhibition.artworkListDriveUrl}" rel="noopener" target="_blank">作品一覧を開く</a>`
      : '';

    const displayStartDate = exhibition.startDate.replaceAll('-', '/');
    const displayEndDate = exhibition.endDate.replaceAll('-', '/');

    const navigationLinks = navigation
      .map(
        (item) =>
          `<li${item.id === exhibition.id ? ' aria-current="page"' : ''}><a href="/exhibitions/${item.id}/">${item.name}</a></li>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>${exhibition.name}</title>
  </head>
  <body>
    <article class="exhibition-detail">
      <header>
        <h1>${exhibition.name}</h1>
        <p class="exhibition-venue">${exhibition.venue}</p>
      </header>
      <section class="exhibition-dates">
        <h2>開催期間</h2>
        <p>${displayStartDate} 〜 ${displayEndDate}</p>
      </section>
      <section class="exhibition-story">
        <h2>開催経緯</h2>
        <p>${exhibition.story}</p>
      </section>
      <section class="highlights">
        <h2>見どころ</h2>
        <p>${exhibition.highlights}</p>
      </section>
      <section class="exhibition-summary">
        <h2>概要</h2>
        <p>${exhibition.summary}</p>
      </section>
      <section class="exhibition-links">
        <h2>関連リンク</h2>
        <ul class="related-links">${relatedLinks}</ul>
        <p><a href="${exhibition.detailUrl}" rel="noopener" target="_blank">詳細説明を読む</a></p>
        <p><a href="${exhibition.overviewUrl}" rel="noopener" target="_blank">公式サイトへ</a></p>
        ${artworkLink}
        ${exhibition.noteUrl ? `<a href="${exhibition.noteUrl}" class="note-link" rel="noopener" target="_blank">Note記事</a>` : ''}
      </section>
      ${standfmSection}
    </article>
    <nav class="exhibition-navigation">
      <h2>他の展示</h2>
      <ul>${navigationLinks}</ul>
    </nav>
  </body>
</html>`;
  }
}
