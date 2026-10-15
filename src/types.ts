export type Page = 'id' | 'board' | 'market' | 'bridge' | 'docs'

export interface ChaosProfile {
  reputationScore: bigint
  txCount: bigint
  volumeUsdc: bigint
  joinedAt: bigint
  exists: boolean
}
