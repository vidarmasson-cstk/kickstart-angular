import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { ContentstackService } from '../../services/contentstack.service';
import { BannerComponent } from '../banner/banner.component';
import { BlocksComponent } from '../blocks/blocks.component';

/** Renders the deal_page entry whose `url` matches the current path (/deals/...). */
@Component({
  selector: 'app-deal-page',
  standalone: true,
  imports: [BannerComponent, BlocksComponent, RouterLink],
  template: `
    <div class="border-b border-ck-line bg-white">
      <div class="ck-container relative flex h-14 items-center justify-center">
        <a routerLink="/deals" class="absolute left-4 flex items-center gap-2 text-lg no-underline hover:text-ck-red md:left-6">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </a>
        <span class="text-lg font-bold">Deals</span>
      </div>
    </div>
    @if (loading()) {
      <div class="ck-container py-24 text-center text-ck-ink/50">Loading…</div>
    } @else if (page()) {
      <!-- banner is a reference field: an array with at most one banner entry, included by the query -->
      @if (page()?.banner?.[0]; as banner) {
        <div [attr.data-cslp]="page()?.$?.banner?.['data-cslp']"><app-banner [banner]="banner"></app-banner></div>
      }
      <main [attr.data-cslp]="page()?.$?.blocks?.['data-cslp']">
        <app-blocks [blocks]="page()?.blocks ?? []" [tags]="page()?.$" dealVariant="detail"></app-blocks>
      </main>
    } @else {
      <main class="ck-container py-24 text-center">
        <p class="ck-eyebrow">404</p>
        <h1 class="mt-2 text-5xl">This deal has expired</h1>
        <p class="mt-4 text-ck-ink/70">{{ error() || 'We could not find a deal at ' + path() + '.' }}</p>
        <a routerLink="/deals" class="ck-button mt-8">See all deals</a>
      </main>
    }
  `
})
export class DealPageComponent implements OnInit {
  private readonly contentstack = inject(ContentstackService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal<any>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly path = signal('/');

  ngOnInit() {
    // Navigating from one deal to another reuses this component, so reload on every navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    ContentstackLivePreview.onEntryChange(() => this.load(false));
    this.load();
  }

  private load(showSpinner = true) {
    const path = this.router.url.split(/[?#]/)[0];
    if (!path.startsWith('/deals/')) return;
    this.path.set(path);
    if (showSpinner) this.loading.set(true);
    this.contentstack.getEntryByUrl('deal_page', path, ['banner']).subscribe({
      next: (entry) => {
        this.page.set(entry ?? null);
        this.error.set('');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Contentstack error:', err);
        this.page.set(null);
        this.error.set('Error loading content. Please check your Contentstack configuration.');
        this.loading.set(false);
      }
    });
  }
}
