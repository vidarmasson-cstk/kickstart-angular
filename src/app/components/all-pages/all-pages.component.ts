import { Component, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A small "All pages" dropdown with a filter, for when there are too many pages for the main menu. */
@Component({
  selector: 'app-all-pages',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative">
      <button type="button" (click)="toggle()" [attr.aria-expanded]="open()"
        class="flex items-center gap-1 rounded px-2 py-1 text-white/70 hover:text-white">
        All pages ({{ pages().length }})
        <span class="text-[10px] transition-transform" [class.rotate-180]="open()">▼</span>
      </button>

      @if (open()) {
        <div class="absolute right-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-ck-line bg-white text-ck-ink shadow-xl">
          @if (pages().length > 8) {
            <input type="search" placeholder="Filter pages…" autofocus
              class="w-full border-b border-ck-line px-4 py-2 text-sm outline-none"
              [value]="filter()" (input)="filter.set($any($event.target).value)" />
          }
          <ul class="max-h-80 overflow-y-auto py-1 text-sm">
            @for (page of filtered(); track page.url) {
              <li>
                <a [routerLink]="page.url" (click)="open.set(false)"
                  class="block px-4 py-2 no-underline hover:bg-ck-grey hover:text-ck-red">
                  {{ page.title }}
                  <span class="block text-xs text-ck-ink/50">{{ page.url }}</span>
                </a>
              </li>
            } @empty {
              <li class="px-4 py-3 text-ck-ink/50">No pages match.</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class AllPagesComponent {
  private readonly host = inject(ElementRef);

  readonly pages = input<{ title: string; url: string }[]>([]);
  readonly open = signal(false);
  readonly filter = signal('');
  readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    return q ? this.pages().filter((p) => `${p.title} ${p.url}`.toLowerCase().includes(q)) : this.pages();
  });

  toggle() {
    this.open.update((o) => !o);
    this.filter.set('');
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (this.open() && !this.host.nativeElement.contains(event.target)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  closeOnEscape() {
    this.open.set(false);
  }
}
