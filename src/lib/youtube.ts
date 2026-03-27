/**
 * YouTube Data API v3 helpers.
 */

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YoutubePlaylistMeta {
  name: string;
  id: string;
}

export interface YoutubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
}

export interface PlaylistWithVideos {
  playlist: YoutubePlaylistMeta;
  videos: YoutubeVideo[];
}

function getApiKey(): string {
  return import.meta.env.YOUTUBE_KEY;
}

/**
 * Parses YOUTUBE_PLAYLISTS: "Name|playlistId,Name2|id2,..."
 */
export function getPlaylists(): YoutubePlaylistMeta[] {
  const raw = import.meta.env.YOUTUBE_PLAYLISTS ?? '';
  const items: YoutubePlaylistMeta[] = [];
  for (const segment of raw.split(',')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const pipe = trimmed.indexOf('|');
    if (pipe === -1) continue;
    const name = trimmed.slice(0, pipe).trim();
    const id = trimmed.slice(pipe + 1).trim();
    if (name && id) items.push({ name, id });
  }
  return items;
}

export async function getPlaylistVideos(playlistId: string, maxResults: number): Promise<YoutubeVideo[]> {
  const key = getApiKey();
  const videos: YoutubeVideo[] = [];
  let pageToken: string | undefined;

  while (videos.length < maxResults) {
    const remaining = maxResults - videos.length;
    const take = Math.min(50, remaining);
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', String(take));
    url.searchParams.set('key', key);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`YouTube API ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          publishedAt?: string;
          resourceId?: { videoId?: string };
          thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
        };
      }>;
      nextPageToken?: string;
    };

    const items = data.items ?? [];
    for (const item of items) {
      const vid = item.snippet?.resourceId?.videoId;
      if (!vid) continue;
      const title = item.snippet?.title ?? 'Video';
      const publishedAt = item.snippet?.publishedAt ?? '';
      const thumb =
        item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? '';
      videos.push({
        videoId: vid,
        title,
        publishedAt,
        thumbnailUrl: thumb,
        url: `https://www.youtube.com/watch?v=${vid}`,
      });
    }

    if (!data.nextPageToken || items.length === 0) break;
    pageToken = data.nextPageToken;
  }

  return videos;
}

export async function getAllPlaylistsWithVideos(): Promise<PlaylistWithVideos[]> {
  const playlists = getPlaylists();
  const results = await Promise.all(
    playlists.map(async (playlist) => {
      const videos = await getPlaylistVideos(playlist.id, 50);
      return { playlist, videos };
    }),
  );
  return results;
}
