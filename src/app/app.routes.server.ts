import { RenderMode, ServerRoute } from '@angular/ssr';

// Content changes without a rebuild, so every page is rendered on request rather than prerendered.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
