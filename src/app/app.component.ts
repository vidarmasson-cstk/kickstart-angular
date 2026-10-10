import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ContentstackService } from './services/contentstack.service';
import { AllPagesComponent } from './components/all-pages/all-pages.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AllPagesComponent],
  template: `
    <div class="bg-ck-ink text-xs">
      <div class="ck-container flex h-8 items-center justify-end">
        <app-all-pages [pages]="navigation()"></app-all-pages>
      </div>
    </div>
    <header class="sticky top-0 z-20 bg-ck-red text-white shadow-md">
      <div class="ck-container flex h-16 items-center justify-between gap-6">
        <a routerLink="/" class="flex items-center rounded-xl bg-white px-3 py-1.5 no-underline shadow-sm" aria-label="Circle K home">
          <img src="https://eu-images.contentstack.com/v3/assets/bltfb10c80b1d9f0d4c/am81cba4689222d3c4/ad68e2bd1ec7396d1cc86f46/circlek-logo.svg"
               alt="Circle K" class="h-8 w-auto" />
        </a>
        <nav class="flex items-center gap-1 overflow-x-auto text-sm font-semibold">
          <a routerLink="/" routerLinkActive="bg-ck-red-dark" [routerLinkActiveOptions]="{ exact: true }"
             class="rounded-full px-4 py-2 no-underline hover:bg-ck-red-dark">Home</a>
          @for (link of navigation(); track link.url) {
            <a [routerLink]="link.url" routerLinkActive="bg-ck-red-dark"
               class="whitespace-nowrap rounded-full px-4 py-2 no-underline hover:bg-ck-red-dark">{{ link.title }}</a>
          }
        </nav>
      </div>
      <div class="h-1 bg-ck-orange"></div>
    </header>

    <router-outlet></router-outlet>

    <footer class="mt-16 bg-ck-ink text-white">
      <div class="ck-container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p class="font-display text-2xl">Circle K</p>
          <p class="mt-2 text-sm text-white/70">Making stops easy: fuel, charging, coffee and food on the go.</p>
        </div>
        <div class="text-sm">
          <p class="mb-2 font-semibold">Explore</p>
          <ul class="space-y-1 text-white/80">
            @for (link of navigation(); track link.url) {
              <li><a [routerLink]="link.url" class="no-underline hover:text-white">{{ link.title }}</a></li>
            }
          </ul>
        </div>
        <p class="text-xs text-white/50 md:text-right">Demo site powered by Contentstack. Offers and prices are illustrative.</p>
      </div>
    </footer>
  `
})
export class App implements OnInit {
  private readonly contentstack = inject(ContentstackService);
  readonly navigation = signal<{ title: string; url: string }[]>([]);

  ngOnInit() {
    this.contentstack.getNavigation('landing_page').subscribe({
      next: (links) => this.navigation.set(links),
      error: (err) => console.error('Could not load navigation', err)
    });
  }
}
