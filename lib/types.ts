// Shared types between server API routes and client components.

export interface TorrentioStream {
  name: string;
  title: string;
  description?: string;
  infoHash?: string;
  fileIdx?: number;
  url?: string;
  behaviorHints?: {
    filename?: string;
    bingeGroup?: string;
  };
}

export interface ResolvedStream extends TorrentioStream {
  displayName: string;
  quality: string;
  cached: boolean;
  sizeLabel?: string;
  seeders?: number;
  container?: string;
  source?: string;
}

export interface CinemetaMeta {
  id: string;
  name: string;
  type?: "movie" | "series";
  poster?: string;
  background?: string;
  description?: string;
  year?: number | string;
  releaseInfo?: string;
  imdbRating?: string | number;
  genres?: string[];
  runtime?: string;
  videos?: Array<{
    id: string;
    title?: string;
    name?: string;
    released?: string;
    season?: number;
    episode?: number;
  }>;
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  name?: string;
  title?: string;
  released?: string;
}