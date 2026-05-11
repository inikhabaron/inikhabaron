export const ADS_CONFIG = {
  placements: [
    { id: 'header-banner', type: 'programmatic', position: 'header', size: '728x90', enabled: true },
    { id: 'sidebar-square', type: 'programmatic', position: 'sidebar', size: '300x250', enabled: true },
    { id: 'in-article-1', type: 'native', position: 'in-article', afterParagraph: 3, enabled: true },
    { id: 'in-article-2', type: 'native', position: 'in-article', afterParagraph: 7, enabled: true },
    { id: 'footer-banner', type: 'programmatic', position: 'footer', size: '728x90', enabled: true },
    { id: 'video-preroll', type: 'video', position: 'video-player', duration: 15, enabled: true },
  ],
  refreshInterval: 30000,
  lazyLoad: true,
};
