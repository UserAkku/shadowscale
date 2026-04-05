const TOTAL_SHARDS = 3


const getShardNumber = (shortCode) => {
  return shortCode.charCodeAt(0) % TOTAL_SHARDS
}

const getShardTable = (shortCode) => {
  const shardNum = getShardNumber(shortCode)
  return `urls_shard_${shardNum}`
}

module.exports = { getShardTable, getShardNumber }