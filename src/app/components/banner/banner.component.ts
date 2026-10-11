import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Renders a `banner` entry. Pages don't contain the banner, they reference it: the page's `banner` field
 * points at a separate entry, which the Delivery API includes when the query asks for it
 * (getEntryByUrl(..., ['banner'])). One banner entry can be shown on many pages.
 */
@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    @let b = banner();
    <aside class="bg-ck-yellow text-ck-ink">
      <div class="ck-container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-3 text-center text-sm font-semibold md:text-base">
        <span [attr.data-cslp]="cslp('message')">{{ b.message }}</span>
        @if (b.link_label && b.link_url) {
          @if (isInternal(b.link_url)) {
            <a [routerLink]="path(b.link_url)" [fragment]="fragment(b.link_url)" class="underline underline-offset-4 hover:text-ck-red"
               [attr.data-cslp]="cslp('link_label')">{{ b.link_label }} →</a>
          } @else {
            <a [href]="b.link_url" class="underline underline-offset-4 hover:text-ck-red" [attr.data-cslp]="cslp('link_label')">{{ b.link_label }} →</a>
          }
        }
      </div>
    </aside>
  `
})
export class BannerComponent {
  readonly banner = input.required<any>();

  cslp(field: string): string | null { return this.banner()?.$?.[field]?.['data-cslp'] ?? null; }
  isInternal(url: string): boolean { return url.startsWith('/'); }
  path(url: string): string { return url.split('#')[0]; }
  fragment(url: string): string | undefined { return url.split('#')[1]; }
}
