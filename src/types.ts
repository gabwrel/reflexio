/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameMode {
  CLASSIC = 'classic',
  SPIKE = 'spike'
}

export interface ScoreEntry {
  id: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  game_mode: 'classic' | 'spike';
  score: number; // reaction_time_ms for classic, defuse_score for spike
  reaction_time_ms?: number; // classic reaction time
  remaining_time_ms?: number; // remaining time in spike defuse (seconds)
  defuse_score?: number; // calculated score for spike defuse (0 to 1000)
  is_guest: boolean;
  created_at: string;
}

export interface ProfileStats {
  id: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  is_guest: boolean;
  games_played: number;
  classic_best: number | null; // min ms
  classic_avg: number | null; // avg ms
  spike_best_score: number | null; // max score
  spike_best_remaining: number | null; // max remaining time
  created_at: string;
}

export interface GlobalStats {
  total_players: number;
  total_games_played: number;
  best_reaction_time: number | null;
  average_reaction_time: number | null;
}

export interface UserSession {
  id: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  is_guest: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  metric: string;
}
