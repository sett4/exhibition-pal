import type { Exhibition, ExhibitionsData } from '../../data/types.js';

/**
 * Eleventy template responsible for rendering the exhibitions listing page.
 */
export default class ExhibitionsListingTemplate {
  /**
   * Defines Eleventy metadata for the exhibitions listing page.
   */
  data() {
    return {
      permalink: 'exhibitions/index.html',
      layout: 'layouts/base.njk',
      title: 'Exhibitions',
    };
  }

  /**
   * Renders the exhibitions listing page.
   * @param data Global data injected by Eleventy.
   * @returns HTML markup for the listing.
   */
  render(data: ExhibitionsData): string {
    const cards = data.exhibitions.map((exhibition) => this.renderCard(exhibition)).join('\n');

    return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>Exhibitions</title>
  </head>
  <body>
    <section class="exhibitions-list">
      ${cards}
    </section>
  </body>
</html>`;
  }

  /**
   * Renders a single exhibition card.
   * @param exhibition Exhibition record to display.
   * @returns HTML snippet for the card.
   */
  private renderCard(exhibition: Exhibition): string {
    const displayStartDate = exhibition.startDate.replaceAll('-', '/');
    const displayEndDate = exhibition.endDate.replaceAll('-', '/');
    const imageMarkup = exhibition.imageUrl
      ? `<figure class="exhibition-image"><img src="${exhibition.imageUrl}" alt="${exhibition.name}" loading="lazy" /></figure>`
      : '';

    const noteMarkup = exhibition.noteUrl
      ? `<p class="note-link"><a href="${exhibition.noteUrl}" rel="noopener" target="_blank">Note</a></p>`
      : '<p class="note-link"></p>';

    const relatedLinks = exhibition.relatedUrls
      .map((url) => `<li><a href="${url}" rel="noopener" target="_blank">関連リンク</a></li>`)
      .join('');

    return `<article class="exhibition-card" data-exhibition-id="${exhibition.id}" data-start-date="${exhibition.startDate}">
  <header>
    <h2><a href="/exhibitions/${exhibition.id}/">${exhibition.name}</a></h2>
    <p class="exhibition-venue">${exhibition.venue}</p>
  </header>
  <p class="exhibition-dates">${displayStartDate} - ${displayEndDate}</p>
  <p class="exhibition-overview"><a href="${exhibition.overviewUrl}" rel="noopener" target="_blank">概要</a></p>
  ${imageMarkup}
  <p class="exhibition-summary">${exhibition.summary}</p>
  ${noteMarkup}
  <ul class="related-links">${relatedLinks}</ul>
</article>`;
  }
}
