const TOTAL_SHARDS: number = 3

export const getShardNumber = (shortCode: string): number => {
  return shortCode.charCodeAt(0) % TOTAL_SHARDS
}

export const getShardTable = (shortCode: string): string => {
  const shardNum: number = getShardNumber(shortCode)
  return `urls_shard_${shardNum}`
}