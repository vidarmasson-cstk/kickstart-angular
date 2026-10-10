import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { ContentstackService } from '../../services/contentstack.service';
import { BlocksComponent } from '../blocks/blocks.component';

/** Renders the landing_page entry whose `url` matches the current path. */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [BlocksComponent, RouterLink],
  template: `
    @if (loading()) {
      <div class="ck-container py-24 text-center text-ck-ink/50">Loading…</div>
    } @else if (page()) {
      <main [attr.data-cslp]="page()?.$ && page()?.$.blocks?.['data-cslp']">
        <app-blocks [blocks]="page()?.blocks ?? []" [tags]="page()?.$"></app-blocks>
      </main>
    } @else {
      <main class="ck-container py-24 text-center">
        <p class="ck-eyebrow">404</p>
        <h1 class="mt-2 text-5xl">This page took a detour</h1>
        <p class="mt-4 text-ck-ink/70">{{ error() || 'We could not find a page at ' + path() + '.' }}</p>
        <a routerLink="/" class="ck-button mt-8">Back to the home page</a>
      </main>
    }
  `
})
export class LandingPageComponent implements OnInit {
  private readonly contentstack = inject(ContentstackService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal<any>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly path = signal('/');

  ngOnInit() {
    // The wildcard route reuses this component, so reload on every navigation, not just on init
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    ContentstackLivePreview.onEntryChange(() => this.load(false));
    this.load();
  }

  private load(showSpinner = true) {
    const path = this.router.url.split(/[?#]/)[0] || '/';
    this.path.set(path);
    if (showSpinner) this.loading.set(true);
    this.contentstack.getEntryByUrl('landing_page', path).subscribe({
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
