import MiniSearch from "minisearch";
import { normalize } from "./normalize";
import {
  openSearchDB,
  getStoredIndex,
  storeIndex,
  getAllMeta,
  type SongMeta,
} from "./search-db";

export type { SongMeta };

export type SearchResult = {
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  tags: string[];
  hasAudio: boolean;
  score: number;
};

export type SearchEngine = {
  search: (query: string) => SearchResult[];
  getAllMeta: () => SongMeta[];
};

const MINISEARCH_OPTIONS: ConstructorParameters<typeof MiniSearch>[0] = {
  fields: ["title", "subtitle", "lyrics", "tags"],
  storeFields: [],
  processTerm: (term) => normalize(term),
};

const SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  boost: { title: 10, subtitle: 5 },
  combineWith: "OR" as const,
};

// Singleton promise — concurrent callers get the same promise
let enginePromise: Promise<SearchEngine> | null = null;

export function initSearchIndex(): Promise<SearchEngine> {
  if (enginePromise !== null) {
    return enginePromise;
  }

  enginePromise = (async (): Promise<SearchEngine> => {
    let miniSearch: MiniSearch;
    let metaList: SongMeta[];

    // Try IndexedDB first (skip on SSR — indexedDB is undefined server-side)
    const db = typeof window !== "undefined" ? await openSearchDB() : null;

    if (db !== null) {
      const stored = await getStoredIndex(db).catch(() => null);

      if (stored !== null) {
        // Deserialize from IDB cache
        miniSearch = MiniSearch.loadJSON(stored.indexData, MINISEARCH_OPTIONS);
        metaList = await getAllMeta(db).catch(() => []);

        return buildEngine(miniSearch, metaList);
      }
    }

    // Fallback: fetch from network
    const response = await fetch("/search-index.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch search index: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      version: string;
      index: unknown;
      meta: SongMeta[];
    };

    miniSearch = MiniSearch.loadJSON(JSON.stringify(data.index), MINISEARCH_OPTIONS);
    metaList = data.meta;

    // Persist to IDB for next visit (fire-and-forget)
    if (db !== null) {
      storeIndex(db, data.version, JSON.stringify(data.index), metaList).catch(
        () => {/* non-fatal */}
      );
    }

    return buildEngine(miniSearch, metaList);
  })();

  // On failure, clear the singleton so callers can retry
  enginePromise.catch(() => {
    enginePromise = null;
  });

  return enginePromise;
}

function buildEngine(miniSearch: MiniSearch, metaList: SongMeta[]): SearchEngine {
  const metaMap = new Map<string, SongMeta>(metaList.map((m) => [m.id, m]));

  return {
    search(query: string): SearchResult[] {
      if (query.trim() === "") {
        return [];
      }

      const raw = miniSearch.search(query, SEARCH_OPTIONS);

      return raw
        .slice(0, 20)
        .map((r) => {
          const meta = metaMap.get(r.id as string);
          if (!meta) return null;
          return {
            slug: meta.id,
            title: meta.title,
            subtitle: meta.subtitle,
            category: meta.category,
            tags: meta.tags,
            hasAudio: meta.hasAudio,
            score: r.score,
          } satisfies SearchResult;
        })
        .filter((r): r is SearchResult => r !== null);
    },

    getAllMeta(): SongMeta[] {
      return metaList;
    },
  };
}
