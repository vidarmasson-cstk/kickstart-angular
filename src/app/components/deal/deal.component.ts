import { Component, computed, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

const CATEGORIES: Record<string, string> = { food: 'Food', drinks: 'Drinks', coffee: 'Coffee', fuel: 'Fuel', car_wash: 'Car wash' };

/**
 * Renders the `deal` global field. The same content structure is used in Deal Page and Landing Page
 * modular blocks, so one component renders it everywhere:
 *   detail  - the deal page, like the deal details screen in the Circle K app
 *   feature - a featured deal inside a landing page
 *   card    - a tile in the /deals overview
 */
@Component({
  selector: 'app-deal',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './deal.component.html'
})
export class DealComponent {
  readonly deal = input.required<any>();
  readonly variant = input<'detail' | 'feature' | 'card'>('detail');

  readonly expanded = signal(false);
  readonly category = computed(() => CATEGORIES[this.deal()?.category] ?? '');
  readonly expires = computed(() => {
    const until = this.deal()?.valid_until;
    if (!until) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(until + 'T00:00:00').getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  });
  readonly visibleSteps = computed(() => {
    const steps = this.deal()?.steps ?? [];
    return this.expanded() ? steps : steps.slice(0, 1);
  });

  cslp(obj: any, field: string): string | null { return obj?.$?.[field]?.['data-cslp'] ?? null; }
  isInternal(url: string | undefined): boolean { return !!url && url.startsWith('/'); }
}
