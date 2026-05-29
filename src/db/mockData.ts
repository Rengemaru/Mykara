import { SongWithStats, TabRow, ScoreRow } from '../types';

export const MOCK_TABS: TabRow[] = [
  { id: 1, name: '十八番', sort_order: 1 },
  { id: 2, name: '練習中', sort_order: 2 },
  { id: 3, name: 'アニソン', sort_order: 3 },
];

export const MOCK_SONGS: SongWithStats[] = [
  {
    id: 1, title: 'ガーネット', artist: '奥華子', key_offset: 1,
    artwork_url: null, memo: '', created_at: '2026-05-01T00:00:00',
    best_score: 92.4, latest_score: 92.4, score_count: 4,
    tabs: [MOCK_TABS[0]],
  },
  {
    id: 2, title: 'Lemon', artist: '米津玄師', key_offset: -3,
    artwork_url: null, memo: '', created_at: '2026-05-02T00:00:00',
    best_score: 89.1, latest_score: 89.1, score_count: 2,
    tabs: [MOCK_TABS[0]],
  },
  {
    id: 3, title: '夜に駆ける', artist: 'YOASOBI', key_offset: 2,
    artwork_url: null, memo: '', created_at: '2026-05-03T00:00:00',
    best_score: 85.7, latest_score: 85.7, score_count: 2,
    tabs: [MOCK_TABS[0], MOCK_TABS[2]],
  },
  {
    id: 4, title: 'カタオモイ', artist: 'Aimer', key_offset: null,
    artwork_url: null, memo: '', created_at: '2026-05-04T00:00:00',
    best_score: 88.3, latest_score: 88.3, score_count: 1,
    tabs: [],
  },
  {
    id: 5, title: '炎', artist: 'LiSA', key_offset: -1,
    artwork_url: null, memo: '', created_at: '2026-05-05T00:00:00',
    best_score: 83.2, latest_score: 83.2, score_count: 2,
    tabs: [MOCK_TABS[1], MOCK_TABS[2]],
  },
];

export const MOCK_SCORES: Record<number, ScoreRow[]> = {
  1: [
    { id: 4, song_id: 1, score: 92.4, scored_at: '2026-05-10' },
    { id: 3, song_id: 1, score: 89.2, scored_at: '2026-04-22' },
    { id: 2, song_id: 1, score: 86.0, scored_at: '2026-04-05' },
    { id: 1, song_id: 1, score: 83.5, scored_at: '2026-03-18' },
  ],
  2: [
    { id: 6, song_id: 2, score: 89.1, scored_at: '2026-05-01' },
    { id: 5, song_id: 2, score: 84.3, scored_at: '2026-04-10' },
  ],
  3: [
    { id: 8, song_id: 3, score: 85.7, scored_at: '2026-05-20' },
    { id: 7, song_id: 3, score: 80.2, scored_at: '2026-03-01' },
  ],
  4: [
    { id: 9, song_id: 4, score: 88.3, scored_at: '2026-05-15' },
  ],
  5: [
    { id: 11, song_id: 5, score: 83.2, scored_at: '2026-05-22' },
    { id: 10, song_id: 5, score: 78.9, scored_at: '2026-04-15' },
  ],
};
