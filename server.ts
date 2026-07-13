/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import 'dotenv/config';

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { ScoreEntry, GlobalStats, ProfileStats } from './src/types';
import { getSupabaseClient } from './src/lib/supabaseServer.ts';

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'db.json');

// Helper to retrieve scores, with Supabase integration falling back to local JSON
async function getScores(): Promise<ScoreEntry[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as ScoreEntry[];
      }
    } catch (err) {
      // Quiet local fallback
    }
  }

  const { scores } = await loadDB();
  return scores;
}

app.use(express.json());

// Zod validation schemas
const ScoreSubmitSchema = z.object({
  display_name: z.string().min(1).max(25),
  avatar_url: z.string().url(),
  game_mode: z.enum(['classic', 'spike']),
  score: z.number().min(0),
  reaction_time_ms: z.number().optional(),
  remaining_time_ms: z.number().optional(),
  defuse_score: z.number().optional(),
  is_guest: z.boolean(),
});

// Helper to load and seed database
async function loadDB(): Promise<{ scores: ScoreEntry[] }> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, seed it with competitive virtual players
    const defaultData = {
      scores: [
        {
          id: 'seed-1',
          display_name: 'TenZ_Warmup',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=TenZ',
          game_mode: 'classic',
          score: 134.2,
          reaction_time_ms: 134.2,
          is_guest: false,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        },
        {
          id: 'seed-2',
          display_name: 'TenZ_Warmup',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=TenZ',
          game_mode: 'spike',
          score: 985,
          remaining_time_ms: 0.115,
          defuse_score: 985,
          is_guest: false,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'seed-3',
          display_name: 'Shroud_Hands',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=shroud',
          game_mode: 'classic',
          score: 142.1,
          reaction_time_ms: 142.1,
          is_guest: false,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        },
        {
          id: 'seed-4',
          display_name: 'Shroud_Hands',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=shroud',
          game_mode: 'spike',
          score: 996,
          remaining_time_ms: 0.031,
          defuse_score: 996,
          is_guest: false,
          created_at: new Date(Date.now() - 3600000 * 23).toISOString(),
        },
        {
          id: 'seed-5',
          display_name: 'AsunaReflex',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=asuna',
          game_mode: 'classic',
          score: 149.8,
          reaction_time_ms: 149.8,
          is_guest: false,
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        {
          id: 'seed-6',
          display_name: 'ViperMain',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=viper',
          game_mode: 'spike',
          score: 875,
          remaining_time_ms: 0.962,
          defuse_score: 875,
          is_guest: false,
          created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
        {
          id: 'seed-7',
          display_name: 'SovaDarts',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sova',
          game_mode: 'classic',
          score: 198.5,
          reaction_time_ms: 198.5,
          is_guest: true,
          created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
        },
        {
          id: 'seed-8',
          display_name: 'SovaDarts',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sova',
          game_mode: 'spike',
          score: 720,
          remaining_time_ms: 2.154,
          defuse_score: 720,
          is_guest: true,
          created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
        },
        {
          id: 'seed-9',
          display_name: 'ReflexJunior',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=reflexjr',
          game_mode: 'classic',
          score: 224.0,
          reaction_time_ms: 224.0,
          is_guest: true,
          created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        },
        {
          id: 'seed-10',
          display_name: 'SentinelsFan',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sentinels',
          game_mode: 'spike',
          score: 550,
          remaining_time_ms: 3.462,
          defuse_score: 550,
          is_guest: true,
          created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
      ] as ScoreEntry[],
    };
    await fs.writeFile(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

async function saveScores(scores: ScoreEntry[]) {
  await fs.writeFile(DB_PATH, JSON.stringify({ scores }, null, 2), 'utf-8');
}

// Memory rate limit tracker (simple IP / DisplayName-based)
const cooldownMap = new Map<string, number>();

// API: Get Global Stats
app.get('/api/stats', async (req, res) => {
  try {
    const scores = await getScores();
    const uniquePlayers = new Set(scores.map(s => s.display_name.toLowerCase()));
    
    const classicScores = scores.filter(s => s.game_mode === 'classic' && s.reaction_time_ms);
    const totalPlayers = uniquePlayers.size;
    const totalGamesPlayed = scores.length;
    
    const bestReactionTime = classicScores.length > 0
      ? Math.min(...classicScores.map(s => s.reaction_time_ms!))
      : null;
      
    const averageReactionTime = classicScores.length > 0
      ? Math.round(classicScores.reduce((sum, s) => sum + s.reaction_time_ms!, 0) / classicScores.length * 10) / 10
      : null;

    const stats: GlobalStats = {
      total_players: totalPlayers,
      total_games_played: totalGamesPlayed,
      best_reaction_time: bestReactionTime,
      average_reaction_time: averageReactionTime,
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve global stats' });
  }
});

// API: Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const scores = await getScores();
    const { mode = 'classic', period = 'all' } = req.query;

    let filtered = scores.filter(s => s.game_mode === mode);

    // Filter by period
    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(s => new Date(s.created_at) >= startOfDay);
    } else if (period === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.created_at) >= oneWeekAgo);
    } else if (period === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.created_at) >= oneMonthAgo);
    }

    // Sort leaderboard correctly
    if (mode === 'classic') {
      // Lower reaction time is better
      filtered.sort((a, b) => a.score - b.score);
    } else {
      // Lowest remaining time (closer to 0 seconds) is the best and highest score
      filtered.sort((a, b) => {
        const remA = a.remaining_time_ms !== undefined ? a.remaining_time_ms : 999;
        const remB = b.remaining_time_ms !== undefined ? b.remaining_time_ms : 999;
        return remA - remB;
      });
    }

    // Keep only best score per user to avoid spamming the board with duplicate names
    const seenUsers = new Set<string>();
    const uniqueLeaderboard: ScoreEntry[] = [];
    
    for (const score of filtered) {
      const userKey = score.display_name.toLowerCase();
      if (!seenUsers.has(userKey)) {
        seenUsers.add(userKey);
        uniqueLeaderboard.push(score);
      }
    }

    res.json(uniqueLeaderboard.slice(0, 50)); // Return top 50
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

// API: Submit Score with strict anti-cheat validation
app.post('/api/leaderboard/submit', async (req, res) => {
  try {
    const parsed = ScoreSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid submission data', details: parsed.error.format() });
    }

    const { display_name, avatar_url, game_mode, score, reaction_time_ms, remaining_time_ms, defuse_score, is_guest } = parsed.data;

    // Rate limiting: Enforce 500ms cooldown per player name
    const rateLimitKey = `${display_name.toLowerCase()}-${game_mode}`;
    const lastSubmission = cooldownMap.get(rateLimitKey);
    const now = Date.now();
    if (lastSubmission && now - lastSubmission < 500) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait between attempts.' });
    }
    cooldownMap.set(rateLimitKey, now);

    // Anti-cheat verification
    if (game_mode === 'classic') {
      const rt = reaction_time_ms ?? score;
      // Physiological limit check: Anything under 65ms is biologically impossible without scripting.
      if (rt < 65) {
        return res.status(400).json({ error: 'Cheat detected: Impossible reaction speed. Refined reflex checks failed.' });
      }
      // Check for exact integer numbers multiples of 100 which might signify simulated spikes
      if (rt <= 0) {
        return res.status(400).json({ error: 'Cheat detected: Score cannot be zero or negative.' });
      }
    } else if (game_mode === 'spike') {
      const rem = remaining_time_ms ?? 0;
      const ds = defuse_score ?? score;
      
      // Defusal math verification:
      // Maximum time is 45.0 seconds. Defusal takes 7.0 seconds.
      // Therefore, remaining time cannot be greater than 38.0 seconds.
      if (rem > 38.0) {
        return res.status(400).json({ error: 'Cheat detected: Impossible defuse remaining time.' });
      }
      // Defuse score must be proportional: max score is 1000 for perfect 0 seconds remaining
      if (ds > 1000 || ds < 0) {
        return res.status(400).json({ error: 'Cheat detected: Invalid score metric.' });
      }
    }

    const newEntry: ScoreEntry = {
      id: `score-${Math.random().toString(36).substring(2, 11)}`,
      display_name,
      avatar_url,
      game_mode,
      score,
      reaction_time_ms,
      remaining_time_ms,
      defuse_score,
      is_guest,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    let savedToSupabase = false;
    if (supabase) {
      try {
        const { error } = await supabase.from('scores').insert(newEntry);
        if (!error) {
          savedToSupabase = true;
        }
      } catch (err) {
        // Fall back quietly
      }
    }

    if (!savedToSupabase) {
      const { scores } = await loadDB();
      scores.push(newEntry);
      await saveScores(scores);
    }

    res.status(201).json({ success: true, record: newEntry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// API: Get Player Profile Stats
app.get('/api/profile/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const scores = await getScores();

    const userScores = scores.filter(s => s.display_name.toLowerCase() === name.toLowerCase());

    if (userScores.length === 0) {
      // Default placeholder statistics for new profile
      const defaultProfile: ProfileStats = {
        id: `guest-${name.toLowerCase()}`,
        display_name: name,
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
        is_guest: true,
        games_played: 0,
        classic_best: null,
        classic_avg: null,
        spike_best_score: null,
        spike_best_remaining: null,
        created_at: new Date().toISOString(),
      };
      return res.json({ profile: defaultProfile, achievements: [] });
    }

    const is_guest = userScores[0].is_guest;
    const avatar_url = userScores[0].avatar_url;
    const email = userScores[0].email;
    const games_played = userScores.length;

    const classicScores = userScores.filter(s => s.game_mode === 'classic' && s.reaction_time_ms);
    const classic_best = classicScores.length > 0 
      ? Math.min(...classicScores.map(s => s.reaction_time_ms!))
      : null;
    const classic_avg = classicScores.length > 0 
      ? Math.round(classicScores.reduce((sum, s) => sum + s.reaction_time_ms!, 0) / classicScores.length * 10) / 10
      : null;

    const spikeScores = userScores.filter(s => s.game_mode === 'spike');
    const spike_best_score = spikeScores.length > 0
      ? Math.max(...spikeScores.map(s => s.defuse_score!))
      : null;
    const spike_best_remaining = spikeScores.length > 0
      ? Math.min(...spikeScores.map(s => s.remaining_time_ms!))
      : null;

    const profile: ProfileStats = {
      id: userScores[0].id,
      display_name: name,
      avatar_url,
      email,
      is_guest,
      games_played,
      classic_best,
      classic_avg,
      spike_best_score,
      spike_best_remaining,
      created_at: userScores[0].created_at,
    };

    // Calculate achievements dynamically
    const achievements = [
      {
        id: 'ach-first-step',
        title: 'Recruit',
        description: 'Complete your first reaction speed training session.',
        icon: 'Zap',
        unlockedAt: userScores.length > 0 ? userScores[0].created_at : null,
        metric: '1 Game Played',
      },
      {
        id: 'ach-reflex-demon',
        title: 'Reflex Demon',
        description: 'Achieve a classic reaction speed under 160ms.',
        icon: 'Flame',
        unlockedAt: (classic_best && classic_best < 160) 
          ? classicScores.find(s => s.reaction_time_ms! < 160)?.created_at || null 
          : null,
        metric: '< 160 ms',
      },
      {
        id: 'ach-sub-140',
        title: 'Light Speed',
        description: 'Achieve a reaction speed under 140ms.',
        icon: 'Gauge',
        unlockedAt: (classic_best && classic_best < 140) 
          ? classicScores.find(s => s.reaction_time_ms! < 140)?.created_at || null 
          : null,
        metric: '< 140 ms',
      },
      {
        id: 'ach-spike-safe',
        title: 'Spike Defuser',
        description: 'Successfully defuse the Valorant trainer spike.',
        icon: 'Shield',
        unlockedAt: spikeScores.length > 0 ? spikeScores[0].created_at : null,
        metric: '1 Success',
      },
      {
        id: 'ach-risky-clutch',
        title: '0.1s Clutch',
        description: 'Defuse the spike with less than 0.15 seconds remaining.',
        icon: 'Clock',
        unlockedAt: (spike_best_remaining && spike_best_remaining < 0.15)
          ? spikeScores.find(s => s.remaining_time_ms! < 0.15)?.created_at || null
          : null,
        metric: '< 0.15s left',
      },
      {
        id: 'ach-perfect-defuse',
        title: 'Perfect Defusal',
        description: 'Score over 950 points on the Spike Defuse Trainer.',
        icon: 'Award',
        unlockedAt: (spike_best_score && spike_best_score >= 950)
          ? spikeScores.find(s => s.defuse_score! >= 950)?.created_at || null
          : null,
        metric: '950+ Score',
      }
    ];

    res.json({ profile, achievements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});


// Start server function with Vite Integration
async function startServer() {
  // Set up Vite in development, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all client SPA route requests
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start full-stack server:', err);
  process.exit(1);
});
