import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

// max 15 chars
export const shortname = 'spotifeed'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
    builder = builder.where('post.indexedAt', '<', timeStr)
  }

  const res = await builder.execute()

  const filteredPosts = res.filter((row) => {
    const textContainsSpotify = row.record.text.toLowerCase().includes('spotify.com');
    const linksContainSpotify = row.record.links?.some(link => link.toLowerCase().includes('spotify.com'));
    return textContainsSpotify || linksContainSpotify;
  });

  const feed = filteredPosts.map((row) => ({
    post: row.uri,
  }));

  let cursor: string | undefined;
  const last = filteredPosts.at(-1);
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString(10);
  }

  return {
    cursor,
    feed,
  };
} 
