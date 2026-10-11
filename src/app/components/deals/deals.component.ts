import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { ContentstackService } from '../../services/contentstack.service';
import { DealComponent } from '../deal/deal.component';

/** /deals: every deal page as a card, rendered from the first Deal block on each page. */
@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [RouterLink, DealComponent],
  template: `
    <section class="bg-ck-red text-white">
      <div class="ck-container py-14">
        <p class="ck-eyebrow !text-ck-yellow">Deals</p>
        <h1 class="mt-2 text-5xl md:text-6xl">Today’s deals</h1>
        <p class="mt-3 text-lg opacity-90">Food, coffee and car care for less. Activate them in the Circle K app.</p>
      </div>
      <div class="h-2 bg-ck-orange"></div>
    </section>
    <main class="ck-container py-12">
      @if (loading()) {
        <p class="py-12 text-center text-ck-ink/50">Loading…</p>
      } @else if (deals().length) {
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of deals(); track item.url) {
            <a [routerLink]="item.url" class="no-underline"><app-deal [deal]="item.deal" variant="card"></app-deal></a>
          }
        </div>
      } @else {
        <p class="py-12 text-center text-ck-ink/70">No deals right now. Check back soon.</p>
      }
    </main>
  `
})
export class DealsComponent implements OnInit {
  private readonly contentstack = inject(ContentstackService);
  readonly deals = signal<{ url: string; deal: any }[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    ContentstackLivePreview.onEntryChange(() => this.load());
    this.load();
  }

  private load() {
    this.contentstack.getEntries('deal_page').subscribe({
      next: (pages) => {
        this.deals.set(
          pages
            .map((p) => ({ url: p.url, deal: p.blocks?.find((b: any) => b.deal)?.deal }))
            .filter((d) => d.deal)
            .sort((a, b) => (a.deal.valid_until ?? '').localeCompare(b.deal.valid_until ?? ''))
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Could not load deals', err);
        this.loading.set(false);
      }
    });
  }
}
