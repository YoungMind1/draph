import { useQuery } from './useQuery.js';

/**
 * @param {{ defaultTitle: string}}
 */
export function DiagramTitle({defaultTitle}) {
  const [query] = useQuery();

  if (!query.length) return defaultTitle;
  return `npmgraph - Dependencies for ${query.join(', ')}`;
}
