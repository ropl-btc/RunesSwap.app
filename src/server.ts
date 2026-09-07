import handler, { createServerEntry } from '@tanstack/react-start/server-entry';

export default createServerEntry({
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname === 'runesswap.app') {
      url.hostname = 'www.runesswap.app';
      url.protocol = 'https:';
      return Response.redirect(url, 308);
    }
    return handler.fetch(request);
  },
});
