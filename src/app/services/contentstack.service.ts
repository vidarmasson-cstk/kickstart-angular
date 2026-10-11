import { Injectable } from '@angular/core';
import * as contentstack from '@contentstack/delivery-sdk';
import { Region, QueryOperation } from "@contentstack/delivery-sdk"
import { Observable, from } from 'rxjs';
import type { Page } from '../../../types'
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { environment } from '../../environments/environment';
import { IStackSdk } from '@contentstack/live-preview-utils';

type Stack = ReturnType<typeof contentstack.default.stack>;

@Injectable({
  providedIn: 'root'
})

export class ContentstackService {
  private readonly stack: Stack;

  constructor() {
    const { contentstack: config } = environment;

    this.stack = contentstack.default.stack({
      apiKey: config.apiKey,
      deliveryToken: config.deliveryToken,
      environment: config.environment,
      region: config.region as Region,
      host: config.contentDelivery,
      live_preview: {
        enable: true,
        preview_token: config.previewToken,
        host: config.previewHost
      }
    })

    if (config.preview) {
      ContentstackLivePreview.init({
        ssr: false,
        enable: true,
        mode: "builder",
        stackSdk: (this.stack as Stack).config as IStackSdk,
        stackDetails: {
          apiKey: config.apiKey,
          environment: config.environment,
          branch: 'main'
        },
        clientUrlParams: {
          host: config.applicationHost
        },
        editButton: {
          enable: true,
          exclude: ["outsideLivePreviewPortal"]
        }
      });
    }
  }

  getEntryByUrl(contentType: string, url: string): Observable<any> {
    const { contentstack: config } = environment;

    return from(
      this.stack
        .contentType(contentType)
        .entry()
        .query()
        .where("url", QueryOperation.EQUALS, url)
        .find<Page>()
        .then((result: any) => {
          const entry = result.entries?.[0];
          if (entry && config.preview) {
            contentstack.default.Utils.addEditableTags(entry, contentType, true);
          }

          return entry
        })
    );
  }

  /** Every entry of a content type (first 100), with editable tags in preview. */
  getEntries(contentType: string): Observable<any[]> {
    const { contentstack: config } = environment;
    return from(
      this.stack
        .contentType(contentType)
        .entry()
        .limit(100)
        .find<Page>()
        .then((result: any) => {
          const entries = result.entries ?? [];
          if (config.preview) entries.forEach((e: any) => contentstack.default.Utils.addEditableTags(e, contentType, true));
          return entries;
        })
    );
  }

  /**
   * Title and URL of every entry of a content type, for navigation. Pages through the results:
   * the Delivery API returns at most 100 entries per request.
   */
  getNavigation(contentType: string): Observable<{ title: string; url: string }[]> {
    const PAGE = 100;
    const fetchAll = async () => {
      const all: { title: string; url: string }[] = [];
      for (let skip = 0; ; skip += PAGE) {
        const result: any = await this.stack
          .contentType(contentType)
          .entry()
          .only(['title', 'url'])
          .includeCount()
          .limit(PAGE)
          .skip(skip)
          .find<{ title: string; url: string }>();
        all.push(...(result.entries ?? []));
        if (!result.entries?.length || all.length >= (result.count ?? 0)) break;
      }
      return all.filter((e) => e.url).sort((a, b) => a.title.localeCompare(b.title));
    };
    return from(fetchAll());
  }
}