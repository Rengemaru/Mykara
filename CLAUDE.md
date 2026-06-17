# 歌帳 — Claude Code 指示書

> **このファイルはClaude Codeへの完全な指示書です。**
> 開発者（オーナー）はExpo学習を兼ねて個人開発しています。
> 実装の前に必ずこのファイル全体を読んでから作業を開始してください。

> **ワイヤーフレーム参照**: `docs/wireframes/歌帳 ワイヤーフレーム v5.html`
> UI実装時は必ずこのワイヤーフレームをデザイン基準として参照すること。

---

## 0. プロジェクト概要

| 項目 | 内容 |
|---|---|
| アプリ名 | 歌帳 |
| 概要 | カラオケの持ち歌・点数を管理するiOSアプリ |
| ターゲット | App Store（iOS）で一般公開 |
| 開発OS | Windows |
| 開発者スキル | Expo初学者・React Native未経験 |
| 優先順位 | 品質 > 納期 > コスト |

---

## 1. 確定技術スタック

| 役割 | 選定 | 理由 |
|---|---|---|
| フレームワーク | React Native + Expo (SDK 54) | Windows環境でiOSビルド可能 |
| 画面遷移 | expo-router v3 | ファイルベースルーティング |
| ローカルDB | expo-sqlite | SQL・多対多・CASCADE削除が必要なため |
| グラフ | react-native-gifted-charts | 点数推移の折れ線グラフ（data/data2で2系列対応） |
| 曲情報補完 | iTunes Search API | 無料・申請不要（MVP実装済み） |
| ファイル共有 | expo-sharing + expo-file-system | バックアップJSON書き出し |
| ビルド | EAS Build | Mac不要・クラウドビルド |
| 提出 | EAS Submit | Windowsから申請可能 |
| 言語 | TypeScript（strict mode） | 型安全を最重視 |

---

## 2. ディレクトリ構成

```
mykara/
├── app/                          # expo-router のルート（画面ファイル）
│   ├── (tabs)/
│   │   ├── index.tsx             # 01 ホーム（曲一覧）
│   │   └── settings.tsx          # 05 設定
│   ├── song/
│   │   ├── [id].tsx              # 02 曲詳細
│   │   └── new.tsx               # 04 曲登録・編集（モーダル）
│   ├── settings/
│   │   └── machine.tsx           # デフォルト機種選択
│   ├── tabs.tsx                  # タブ管理
│   ├── onboarding.tsx            # 初回オンボーディング
│   └── _layout.tsx               # ルートレイアウト（MachineProvider・オンボーディングガード）
├── src/
│   ├── db/
│   │   ├── client.ts             # DB接続・初期化・マイグレーション呼び出し
│   │   ├── schema.ts             # テーブル定義SQL（新規インストール用ベースライン）
│   │   ├── migrations/
│   │   │   └── index.ts          # マイグレーション定義・ランナー
│   │   ├── songs.ts              # Song CRUD関数
│   │   ├── tabs.ts               # Tab CRUD関数
│   │   ├── scores.ts             # Score CRUD関数
│   │   ├── songTabs.ts           # song_tabs 操作関数
│   │   └── settings.ts           # settings テーブルCRUD（AsyncStorage不使用）
│   ├── types/
│   │   └── index.ts              # 全型定義（Song / Tab / Score / Machine）
│   ├── hooks/
│   │   ├── useSongs.ts           # 曲一覧取得フック
│   │   ├── useSongDetail.ts      # 曲詳細・スコア取得フック
│   │   ├── useTabs.ts            # タブ一覧取得フック
│   │   └── useMusicSearch.ts     # iTunes検索フック（1文字以上で発火）
│   ├── contexts/
│   │   └── MachineContext.tsx    # 現在機種のReact Context
│   ├── lib/
│   │   ├── machine.ts            # 機種ロジック・セッション管理・オンボーディング
│   │   └── backup.ts             # バックアップJSON構築・共有シート起動
│   ├── api/
│   │   └── itunesSearch.ts       # iTunes Search API クライアント
│   └── components/
│       ├── SongCard.tsx          # 曲カード（ホーム用）
│       ├── ScoreBottomSheet.tsx  # 点数入力・編集ボトムシート（機種トグル付き）
│       ├── ScoreChart.tsx        # 折れ線グラフ（gifted-charts、DAM/JOYSOUND 2系列）
│       ├── KeyStepper.tsx        # キー（音域）ステッパー
│       └── EmptyState.tsx        # 空状態・ローディング・エラー表示
├── assets/
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

---

## 3. データ設計

### 3-1. テーブル定義（現在の完全スキーマ）

```sql
-- タブ（カテゴリ）
CREATE TABLE IF NOT EXISTS tabs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 曲
CREATE TABLE IF NOT EXISTS songs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  artist      TEXT    NOT NULL DEFAULT '',
  key_offset  INTEGER,                    -- NULL=未設定、+2、-1 など整数
  artwork_url TEXT,                       -- iTunes APIから取得
  memo        TEXT    NOT NULL DEFAULT '', -- メモ（自由入力）
  created_at  TEXT    NOT NULL            -- ISO8601（例: "2026-05-25T21:00:00"）
);

-- 曲↔タブ 中間テーブル（多対多）
CREATE TABLE IF NOT EXISTS song_tabs (
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  tab_id  INTEGER NOT NULL REFERENCES tabs(id)  ON DELETE CASCADE,
  PRIMARY KEY (song_id, tab_id)
);

-- 点数履歴
CREATE TABLE IF NOT EXISTS scores (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  score     REAL    NOT NULL,             -- 小数・整数どちらも対応（例: 92.450）
  scored_at TEXT    NOT NULL,             -- 記録日（例: "2026-05-25"）
  machine   TEXT    NOT NULL              -- 'DAM' or 'JOYSOUND'（DEFAULT なし・必須）
    CHECK (machine IN ('DAM', 'JOYSOUND'))
);

-- アプリ設定（キー・バリュー形式）
-- ⚠️ AsyncStorage は使用禁止。すべて settings テーブルで管理する
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- マイグレーション管理
CREATE TABLE IF NOT EXISTS db_version (
  version INTEGER NOT NULL
);
```

**settings テーブルのキー一覧**

| key | 内容 | 備考 |
|---|---|---|
| `default_machine` | デフォルト機種（`DAM` または `JOYSOUND`） | 設定画面で変更可 |
| `onboarding_completed` | オンボーディング完了フラグ（`"true"`） | 初回起動後に書き込み |
| `session_machine` | セッション中の機種 | バックアップ対象外 |
| `session_date` | セッション日付（ローカル日付 YYYY-MM-DD） | バックアップ対象外 |

### 3-2. マイグレーション機構

- `src/db/migrations/index.ts` にマイグレーション定義を配列で管理
- `db_version` テーブルで適用済みバージョンを追跡
- `initDatabase()` 呼び出し時に未適用のマイグレーションを自動実行
- **新しいカラム/テーブルを追加する際は必ずマイグレーションを追加する**
- 現在のマイグレーション：v1（memo列）→ v2（settingsテーブル）→ v3（machine列）

### 3-3. 設計方針

| 項目 | 決定内容 |
|---|---|
| 曲↔タブの関係 | 多対多。1曲が複数タブに属せる |
| スコアの型 | REAL（小数・整数どちらも対応） |
| 「すべて」タブ | DBに持たずアプリ側コードで固定表示。削除・編集不可 |
| タブ | 自由記述・カスタム命名 |
| 曲削除時 | scores・song_tabs も連鎖削除（ON DELETE CASCADE） |
| タブ削除時 | song_tabs の該当行のみ削除。曲自体は残る |
| 永続化 | **AsyncStorage 使用禁止**。すべて settings テーブルを使う |
| セッション機種 | session_machine + session_date で当日限り記憶（翌日はdefaultに戻る） |

---

## 4. 型定義（`src/types/index.ts`）

```typescript
// ---- DB から取得したままの形（snake_case） ----
export interface SongRow {
  id: number;
  title: string;
  artist: string;
  key_offset: number | null;
  artwork_url: string | null;
  memo: string;
  created_at: string;
}

export interface TabRow {
  id: number;
  name: string;
  sort_order: number;
}

export interface ScoreRow {
  id: number;
  song_id: number;
  score: number;
  scored_at: string;
  machine: string;  // 'DAM' | 'JOYSOUND'
}

// ---- アプリ内で使う集計済みの形 ----
export interface SongWithStats extends SongRow {
  best_score: number | null;   // 最高スコア
  latest_score: number | null; // 最新スコア
  score_count: number;          // 記録回数
  tabs: TabRow[];               // 紐づくタブ一覧
}

// ---- 機種 ----
export type Machine = 'DAM' | 'JOYSOUND';
export const MACHINES: readonly Machine[] = ['DAM', 'JOYSOUND'];
```

---

## 5. DB実装サンプル

### 5-1. DB初期化（`src/db/client.ts`）

```typescript
import * as SQLite from 'expo-sqlite';
import { schema } from './schema';

// DB接続はシングルトン（1つだけ作る）
const db = SQLite.openDatabaseSync('mykara.db');

export function initDatabase(): void {
  // PRAGMA: 外部キー制約を有効化（ON DELETE CASCADE を機能させるために必須）
  db.execSync('PRAGMA foreign_keys = ON;');
  // スキーマ（テーブル定義）を流す
  db.execSync(schema);
}

export { db };
```

### 5-2. スキーマ（`src/db/schema.ts`）

```typescript
export const schema = `
  CREATE TABLE IF NOT EXISTS tabs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS songs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    artist      TEXT    NOT NULL DEFAULT '',
    key_offset  INTEGER,
    artwork_url TEXT,
    created_at  TEXT    NOT NULL
  );
  CREATE TABLE IF NOT EXISTS song_tabs (
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    tab_id  INTEGER NOT NULL REFERENCES tabs(id)  ON DELETE CASCADE,
    PRIMARY KEY (song_id, tab_id)
  );
  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    score     REAL    NOT NULL,
    scored_at TEXT    NOT NULL
  );
`;
```

### 5-3. Song CRUD（`src/db/songs.ts`）

```typescript
import { db } from './client';
import { SongRow, SongWithStats } from '../types';

/** 全曲取得（最高スコア・最新スコア・記録回数をJOINで集計） */
export function getAllSongs(): SongWithStats[] {
  return db.getAllSync<SongWithStats>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    LEFT JOIN scores sc ON sc.song_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
}

/** タブ別曲取得 */
export function getSongsByTab(tabId: number): SongWithStats[] {
  return db.getAllSync<SongWithStats>(`
    SELECT
      s.*,
      MAX(sc.score)  AS best_score,
      (SELECT score FROM scores WHERE song_id = s.id ORDER BY scored_at DESC LIMIT 1) AS latest_score,
      COUNT(sc.id)   AS score_count
    FROM songs s
    JOIN song_tabs st ON st.song_id = s.id
    LEFT JOIN scores sc ON sc.song_id = s.id
    WHERE st.tab_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, [tabId]);
}

/** 曲を1件登録 */
export function insertSong(
  title: string,
  artist: string,
  keyOffset: number | null
): number {
  const result = db.runSync(
    `INSERT INTO songs (title, artist, key_offset, created_at) VALUES (?, ?, ?, ?)`,
    [title, artist, keyOffset, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

/** 曲を更新 */
export function updateSong(
  id: number,
  title: string,
  artist: string,
  keyOffset: number | null
): void {
  db.runSync(
    `UPDATE songs SET title = ?, artist = ?, key_offset = ? WHERE id = ?`,
    [title, artist, keyOffset, id]
  );
}

/** 曲を削除（scores・song_tabsも連鎖削除） */
export function deleteSong(id: number): void {
  db.runSync(`DELETE FROM songs WHERE id = ?`, [id]);
}
```

### 5-4. song_tabs 操作（`src/db/songTabs.ts`）

```typescript
import { db } from './client';
import { TabRow } from '../types';

/** 曲に紐づくタブ一覧を取得 */
export function getTabsBySong(songId: number): TabRow[] {
  return db.getAllSync<TabRow>(
    `SELECT t.* FROM tabs t JOIN song_tabs st ON st.tab_id = t.id WHERE st.song_id = ?`,
    [songId]
  );
}

/** 曲とタブを紐づける */
export function attachTab(songId: number, tabId: number): void {
  db.runSync(
    `INSERT OR IGNORE INTO song_tabs (song_id, tab_id) VALUES (?, ?)`,
    [songId, tabId]
  );
}

/** 曲からタブの紐づけを外す */
export function detachTab(songId: number, tabId: number): void {
  db.runSync(
    `DELETE FROM song_tabs WHERE song_id = ? AND tab_id = ?`,
    [songId, tabId]
  );
}

/** 曲のタブを一括更新（登録・編集フォームで使用） */
export function syncTabs(songId: number, tabIds: number[]): void {
  // いったん全削除して貼り直す（差分管理より単純で安全）
  db.runSync(`DELETE FROM song_tabs WHERE song_id = ?`, [songId]);
  for (const tabId of tabIds) {
    attachTab(songId, tabId);
  }
}
```

---

## 6. 画面仕様

### 6-1. 画面一覧

| No. | 画面名 | ファイルパス |
|---|---|---|
| 01 | ホーム（曲一覧） | `app/(tabs)/index.tsx` |
| 01b | 曲カード左スワイプ | 01の中で制御 |
| 02 | 曲詳細 | `app/song/[id].tsx` |
| 02b | 点数編集（ボトムシート） | 02の中で制御 |
| 03 | 点数入力（ボトムシート） | 01・02の中で制御 |
| 04 | 曲登録・編集（モーダル） | `app/song/new.tsx` |
| 05 | 設定 | `app/(tabs)/settings.tsx` |

### 6-2. 画面遷移フロー

```
ホーム（01）
├─ 曲カードをタップ              → 02 曲詳細
├─ 曲カードの ✏️ をタップ        → 03 点数入力ボトムシート（新規）
├─ 曲カードを左スワイプ
│   ├─ [✏️ 編集]               → 04 曲編集フォーム（入力済み）
│   └─ [🗑 削除]               → 確認ダイアログ → 削除
└─ ＋ボタンをタップ              → 04 曲登録

曲詳細（02）
├─ 「点数を記録する」ボタン       → 03 点数入力ボトムシート（新規）
└─ 履歴行を左スワイプ
    ├─ [✏️ 編集]               → 02b 点数編集ボトムシート（入力済み）
    └─ [🗑 削除]               → 確認ダイアログ → 削除

ボトムナビ
├─ ♪ 曲一覧                   → 01 ホーム
└─ ⚙️ 設定                    → 05 設定
```

### 6-3. デザイントークン

```typescript
// 色
const colors = {
  accent:      '#5b4cf5',  // メインカラー（パープル）
  accentSoft:  'rgba(91, 76, 245, 0.10)',
  green:       '#00b96b',  // キー正・スコア上昇
  yellow:      '#f59e0b',  // キー負
  red:         '#ef4444',  // 削除ボタン
  text:        '#111827',
  text2:       '#6b7280',
  text3:       '#9ca3af',
  bg:          '#f0f2f7',
  surface:     '#f7f8fc',
  surface2:    '#eef0f6',
  border:      'rgba(0, 0, 0, 0.07)',
  white:       '#ffffff',
};

// フォント（expo-google-fontsで導入）
// - Plus Jakarta Sans: 見出し・アプリタイトル
// - Noto Sans JP: 本文・日本語
// - DM Mono: 数字・スコア表示
```

### 6-4. 各画面の実装仕様

#### 01 ホーム（曲一覧）

- ヘッダー: `MyKara`（Plus Jakarta Sans / 22px / Bold）+ ＋ボタン（右上・アクセント背景）
- タブ: 横スクロール。「すべて」タブは先頭固定・削除不可
- 検索バー: 曲名・アーティスト名でクライアントサイドフィルタリング
- 曲カード構成:
  ```
  [アート40px] [曲名（ellipsis）]  [キーバッジ] [スコア DM Mono] [✏️ボタン]
               [アーティスト名（ellipsis）]
  ```
- キーバッジ: `+n` → 緑、`-n` → 黄、未設定 → 非表示（幅は確保）
- 左スワイプ: `[✏️ 編集]`（accent色）`[🗑 削除]`（red色）の2ボタン
- 空状態: 「まだ曲がありません」+「＋ 最初の曲を追加する」ボタン

#### 02 曲詳細

- ヘッダー: 戻るボタン + 曲名 + アーティスト名
- 最高スコアカード: 最高スコア（34px）+ 前回比（±pt）+ 記録回数
- 点数推移グラフ: Victory Native の `VictoryLine`（折れ線）
- 記録履歴リスト: 日付・スコア。左スワイプで `[✏️ 編集]` `[🗑 削除]`
- 下部固定: `🎤 点数を記録する` ボタン（accent色）

#### 03 点数入力ボトムシート（新規）/ 02b 点数編集ボトムシート（編集）

- 曲詳細画面の上にオーバーレイ（背景暗転）
- ハンドル → 曲名 → スコア表示欄 → テンキー（3×4） → 日付 → 実行ボタン
- テンキー: `1〜9`, `.`, `0`, `⌫`
- 編集時は既存スコア・日付が入力済みで開く
- ボタンラベル: 新規→「記録する」、編集→「変更を保存する」

#### 04 曲登録・編集（共通フォーム）

- 入力項目:
  1. 曲名（テキスト入力・Phase 2でiTunesサジェスト追加予定）
  2. アーティスト名（テキスト入力）
  3. タブ選択（複数選択可。選択済みはアクセント色。「＋ 新規作成」も表示）
  4. キー（音域）ステッパー: `－` / 値 / `＋`。未設定可能
- 下部固定ボタン: 新規→「曲を追加する」、編集→「変更を保存する」

#### 05 設定

- タブ管理: 追加・名前変更・削除・並び替え
- 表示設定: 曲の並び順（登録順 / 名前順 / スコア順）
- データ管理: 全データ削除（赤字・確認ダイアログ必須）
- アプリ情報: バージョン・プライバシーポリシー

---

## 7. 実装ルール（厳守）

### コーディングルール

```
1. TypeScript strict mode を必ず有効にする（tsconfig.json の "strict": true）
2. any 型は使用禁止。型が不明なときは unknown を使い、型ガードで絞る
3. DB操作関数はすべて src/db/ に集約する（画面コンポーネントから直接DBを叩かない）
4. カスタムフック（src/hooks/）でDBアクセスとUIロジックを分離する
5. コンポーネントは1ファイル1コンポーネント
6. マジックナンバーは定数化する（例: const MAX_SCORE = 100）
7. 削除操作は必ず確認ダイアログを挟む
8. エラー発生時は console.error でログを出し、UIにもエラーメッセージを表示する
```

### 「すべて」タブのルール

```typescript
// すべてタブはDBに持たない。コードで固定定義する
export const ALL_TAB = { id: -1, name: 'すべて', sort_order: -1 } as const;
// id が -1 のときは全曲取得クエリを使う
// id が -1 のタブは削除・編集UIに表示しない
```

### PRAGMA foreign_keys の注意点

expo-sqlite は接続のたびに外部キー制約がリセットされる。
`initDatabase()` を呼ぶだけでなく、**アプリ起動時に必ず1回実行する**こと。

---

## 8. WBSとタスク詳細

### Git運用ルール（重要）

```
- 1タスク完了ごとに必ずコミットする
- コミット後、このファイルに記載のコミットメッセージをそのまま使う
- ブランチ戦略: main ブランチに直接コミットでOK（個人開発のため）
- コミットメッセージ形式: [タスクNo] 日本語で内容を説明
```

---

### Phase 0: 環境構築・Expo体験（20h）

> **このフェーズの目的**: 実装より先に「Expoとはどういうものか」を体感する。
> 動くものを触ることでモチベーションを維持し、Phase 1以降の学習コストを下げる。

#### 0-1: Node.js / Expo CLI インストール（1h）

```powershell
# Node.js (LTS版) をインストール後、以下を実行
node -v   # v20以上であることを確認
npm install -g eas-cli
npx expo --version  # インストール確認
```

**完了条件**: `npx expo --version` がバージョン番号を返す

**コミットメッセージ**: なし（ファイル変更なし）

---

#### 0-2: Expoプロジェクト新規作成（1h）

```powershell
npx create-expo-app mykara --template blank-typescript
cd mykara
```

**完了条件**: `mykara/` フォルダが生成され、`app.json` が存在する

**コミットメッセージ**:
```
[0-2] Expoプロジェクト初期作成（blank-typescriptテンプレート）
```

---

#### 0-3: expo-routerの動作確認（2h）

> **学習目的**: expo-routerの「ファイル=画面」という考え方を体感する。

```powershell
npx expo install expo-router react-native-safe-area-context react-native-screens
```

`app/(tabs)/index.tsx` と `app/(tabs)/settings.tsx` を作成し、
ボトムナビで切り替えられることをExpo Goで確認する。

**完了条件**: 実機でタブが2枚切り替えられる

**コミットメッセージ**:
```
[0-3] expo-routerでタブナビゲーションの動作確認
```

---

#### 0-4: EAS CLI インストール・ログイン（1h）

```powershell
eas login
eas build:configure
```

**完了条件**: `eas.json` が生成される

**コミットメッセージ**:
```
[0-4] EAS設定ファイル追加（eas.json）
```

---

#### 0-5: Apple Developer Program 登録（1h）

作業: https://developer.apple.com/programs/ から登録。
審査に数日かかる場合があるため、**Phase 0の最初のタイミングで申し込む**こと。

**完了条件**: Apple Developer Programのステータスが「Active」になる

**コミットメッセージ**: なし（コード変更なし）

---

#### 0-6: SQL基礎学習（4h）

> **クリティカルパス**。ここが詰まるとPhase 1全体がブロックされる。

以下のSQL操作を理解・実行できるようになること:
- `SELECT` / `INSERT` / `UPDATE` / `DELETE`
- `WHERE` による絞り込み
- `JOIN` による複数テーブルの結合
- `LEFT JOIN` と `INNER JOIN` の違い

学習リソース（推奨）: [SQLite Tutorial](https://www.sqlitetutorial.net/)

**完了条件**: 3-1のテーブル定義SQLを読んで、各テーブルの役割が説明できる

**コミットメッセージ**: なし

---

#### 0-7: expo-sqliteの動作確認（2h）

> **クリティカルパス**。

```powershell
npx expo install expo-sqlite
```

簡単なCRUD（`test` テーブルへの insert → select → delete）を実装し、
Expo Goで動作することを確認する。

**完了条件**: `console.log` でDBから取得したデータが出力される

**コミットメッセージ**:
```
[0-7] expo-sqlite動作確認用スクリプト追加
```

---

#### 0-8: TypeScript基礎確認（2h）

以下を理解していること:
- `interface` と `type` の使い分け
- `string | null` などのユニオン型
- 関数の引数・戻り値の型注釈
- `as const` の使い方

**完了条件**: `src/types/index.ts` を読んで各型の意味が説明できる

**コミットメッセージ**: なし

---

#### 0-9: Victory Native インストール・グラフ表示確認（2h）

> ⚠️ ExpoとVictory Nativeの相性問題が報告されている。早めに確認必須。

```powershell
npx expo install victory-native react-native-reanimated react-native-gesture-handler
```

折れ線グラフ（`VictoryLine`）を1枚の画面に表示してみる。
**インストールエラーが出た場合**: 代替ライブラリ `react-native-gifted-charts` を使用する。

**完了条件**: 画面にグラフが表示される

**コミットメッセージ**:
```
[0-9] Victory Native動作確認（グラフ表示テスト）
```

---

#### 0-10: Git初期設定・GitHubリポジトリ作成（2h）

```powershell
git init
git remote add origin <GitHubリポジトリURL>
```

`.gitignore` に以下を必ず追加:
```
node_modules/
.expo/
*.env
```

**完了条件**: GitHubにコードがpushされている

**プルリクエスト**:
- タイトル: `[Phase 0] 環境構築・Expo動作確認`
- Description:
  ```
  ## 変更内容
  - Expoプロジェクト初期作成
  - expo-router タブナビゲーション動作確認
  - EAS設定ファイル追加
  - expo-sqlite 動作確認
  - Victory Native グラフ表示確認

  ## 確認事項
  - [ ] Expo Goで実機動作する
  - [ ] タブが2枚切り替えられる
  - [ ] DBへのCRUDが動作する
  - [ ] グラフが表示される
  ```

---

### Phase 1: データ層の実装（22h）

> **このフェーズの目的**: UIより先にDB操作ロジックを完成させる。
> 土台を固めることで、Phase 2のUI実装がスムーズになる。

#### 1-1: 型定義ファイル作成（1h）

`src/types/index.ts` を作成し、セクション4の型定義をそのまま実装する。

**完了条件**: TypeScriptのコンパイルエラーが0件

**コミットメッセージ**:
```
[1-1] 型定義ファイル作成（Song / Tab / Score / SongWithStats）
```

---

#### 1-2: DBスキーマ定義ファイル作成（1h）

`src/db/schema.ts` を作成し、セクション3-1のSQLをそのまま実装する。

**完了条件**: ファイルが存在し、TypeScriptエラーがない

**コミットメッセージ**:
```
[1-2] DBスキーマ定義ファイル作成（4テーブル）
```

---

#### 1-3: DB初期化処理の実装（2h）

`src/db/client.ts` を作成し、セクション5-1のサンプルをそのまま実装する。
`app/_layout.tsx` でアプリ起動時に `initDatabase()` を呼び出す。

> ⚠️ `PRAGMA foreign_keys = ON` を忘れると ON DELETE CASCADE が動作しない。

**完了条件**: アプリ起動時にDBが初期化され、エラーが出ない

**コミットメッセージ**:
```
[1-3] DB初期化処理の実装（expo-sqlite・PRAGMA foreign_keys有効化）
```

---

#### 1-4: Tabのデータ操作関数（CRUD）実装（2h）

`src/db/tabs.ts` を作成し、以下の関数を実装する:

```typescript
getAllTabs(): TabRow[]
insertTab(name: string): number
updateTab(id: number, name: string): void
deleteTab(id: number): void
updateTabOrder(tabs: { id: number; sort_order: number }[]): void
```

**完了条件**: 各関数を手動で呼び出して動作確認できる

**コミットメッセージ**:
```
[1-4] タブ（Tab）のCRUD関数実装
```

---

#### 1-5: Songのデータ操作関数（CRUD）実装（2h）

`src/db/songs.ts` を作成し、セクション5-3のサンプルをそのまま実装する。

**完了条件**: `getAllSongs()` が空配列を返す（テーブルが存在する証拠）

**コミットメッセージ**:
```
[1-5] 曲（Song）のCRUD関数実装（集計クエリ含む）
```

---

#### 1-6: Scoreのデータ操作関数（CRUD）実装（2h）

`src/db/scores.ts` を作成し、以下の関数を実装する:

```typescript
getScoresBySong(songId: number): ScoreRow[]
insertScore(songId: number, score: number, scoredAt: string): number
updateScore(id: number, score: number, scoredAt: string): void
deleteScore(id: number): void
```

**完了条件**: 各関数を手動で呼び出して動作確認できる

**コミットメッセージ**:
```
[1-6] 点数（Score）のCRUD関数実装
```

---

#### 1-7: song_tabsのデータ操作関数実装（2h）

`src/db/songTabs.ts` を作成し、セクション5-4のサンプルをそのまま実装する。

**完了条件**: `syncTabs(songId, [tabId1, tabId2])` が正しく動く

**コミットメッセージ**:
```
[1-7] 曲↔タブ中間テーブル（song_tabs）の操作関数実装
```

---

#### 1-8: タブ別曲取得クエリの実装（1h）

`getSongsByTab` はセクション5-3に含まれている。
動作確認として、タブを1件作成し、曲を登録・紐づけして取得できることを確認する。

**完了条件**: タブ別フィルタリングが正しく動く

**コミットメッセージ**:
```
[1-8] タブ別曲取得クエリの動作確認
```

---

#### 1-9: カスタムフック作成（3h）

`src/hooks/useSongs.ts`:
```typescript
// 画面が開いたときにDBから曲一覧を取得するフック
export function useSongs(tabId: number) {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      const data = tabId === ALL_TAB.id ? getAllSongs() : getSongsByTab(tabId);
      setSongs(data);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => { reload(); }, [reload]);

  return { songs, loading, error, reload };
}
```

同様に `useSongDetail.ts` / `useTabs.ts` を実装する。

**完了条件**: フックが型エラーなしで実装される

**コミットメッセージ**:
```
[1-9] カスタムフック作成（useSongs / useSongDetail / useTabs）
```

---

#### 1-10: データ操作の動作確認テスト（2h）

画面を作らずに、`_layout.tsx` や仮の画面から各CRUD関数を手動で呼び出し、
以下のシナリオが正しく動くことを確認する:

1. タブを2件作成 → 取得 → 1件削除
2. 曲を1件登録 → 2つのタブに紐づけ → タブ別取得
3. スコアを3件登録 → 最高スコア集計確認
4. 曲を削除 → scores・song_tabsも連鎖削除されることを確認

**完了条件**: 上記4シナリオがすべて正常動作する

**コミットメッセージ**:
```
[1-10] データ層の動作確認テスト完了
```

**プルリクエスト**:
- タイトル: `[Phase 1] データ層の実装完了`
- Description:
  ```
  ## 変更内容
  - 型定義ファイル作成（Song / Tab / Score / SongWithStats）
  - DBスキーマ定義（4テーブル）
  - DB初期化処理（PRAGMA foreign_keys有効化）
  - Song / Tab / Score / song_tabs の CRUD関数実装
  - カスタムフック実装（useSongs / useSongDetail / useTabs）

  ## 確認事項
  - [ ] PRAGMA foreign_keys が有効（CASCADE削除が動く）
  - [ ] タブ別曲取得クエリが正しく動く
  - [ ] 曲削除時にscores・song_tabsも削除される
  - [ ] TypeScriptコンパイルエラー0件
  ```

---

### Phase 2: 画面・UI実装（30h）

> 各タスクはセクション6の画面仕様を必ず参照すること。
> デザイントークンはセクション6-3を使う。

| # | タスク | 目安時間 | コミットメッセージ |
|---|---|---|---|
| 2-1 | タブバー画面の骨格実装（expo-router） | 2h | `[2-1] ボトムナビゲーション骨格実装` |
| 2-2 | ホーム：曲一覧画面（FlatList） | 2h | `[2-2] ホーム曲一覧画面実装` |
| 2-3 | ホーム：タブ横スクロール切り替え | 1h | `[2-3] タブ横スクロール切り替え実装` |
| 2-4 | 曲登録・編集フォーム画面 | 2h | `[2-4] 曲登録・編集フォーム実装` |
| 2-5 | 曲カード左スワイプ（編集・削除） | 2h | `[2-5] 曲カード左スワイプアクション実装` |
| 2-6 | 点数入力ボトムシート（新規） | 2h | `[2-6] 点数入力ボトムシート実装` |
| 2-7 | 点数編集ボトムシート（編集） | 1h | `[2-7] 点数編集ボトムシート実装` |
| 2-8 | 曲詳細画面（最高スコア・履歴） | 2h | `[2-8] 曲詳細画面実装` |
| 2-9 | 点数推移グラフ（Victory Native） | 2h | `[2-9] 点数推移グラフ実装` |
| 2-10 | 履歴行左スワイプ（編集・削除） | 1h | `[2-10] 履歴行左スワイプアクション実装` |
| 2-11 | タブ管理画面（設定内） | 2h | `[2-11] タブ管理画面実装` |
| 2-12 | 設定画面全体 | 2h | `[2-12] 設定画面実装` |
| 2-13 | 空状態・ローディング・エラーUI | 2h | `[2-13] 空状態・ローディング・エラーUI実装` |
| 2-14 | 全体スタイリング・デザイン調整 | 3h | `[2-14] 全体スタイリング・デザイントークン適用` |
| 2-15 | 画面間導線の最終確認 | 2h | `[2-15] 画面遷移・導線の整合確認` |

**Phase 2完了時プルリクエスト**:
- タイトル: `[Phase 2] 画面・UI実装完了`
- Description: 実装した画面の一覧と、実機確認済みスクリーンショットを添付

---

### Phase 3: 統合・品質担保（10h）

| # | タスク | 目安時間 | コミットメッセージ |
|---|---|---|---|
| 3-1 | 実機での動作確認（Expo Go） | 2h | `[3-1] 実機動作確認・修正` |
| 3-2 | エッジケーステスト | 2h | `[3-2] エッジケーステスト・修正` |
| 3-3 | EAS Build（TestFlight配布） | 2h | `[3-3] EAS Build設定・TestFlight配布` |
| 3-4 | TestFlightで動作確認 | 1h | `[3-4] TestFlight動作確認` |
| 3-5 | バグ修正・仕上げ | 3h | `[3-5] バグ修正・最終調整` |

**Phase 3完了時プルリクエスト**:
- タイトル: `[Phase 3] 統合テスト・品質担保完了`
- Description: 発見したバグと対処内容の一覧

---

### Phase 4: ストア申請・公開（10h）

| # | タスク | 目安時間 | コミットメッセージ |
|---|---|---|---|
| 4-1 | App Store Connect セットアップ | 2h | `[4-1] App Store Connect設定完了` |
| 4-2 | スクリーンショット・説明文作成 | 2h | `[4-2] ストア掲載素材作成` |
| 4-3 | プライバシーポリシー作成 | 1h | `[4-3] プライバシーポリシー追加` |
| 4-4 | EAS Submit で申請 | 1h | `[4-4] App Store申請` |
| 4-5 | 審査待ち・フィードバック対応 | 4h | `[4-5] 審査フィードバック対応` |

---

## 9. クリティカルパス

> この順番が1タスクでも遅れると、全体のゴールが後ろにズレる最重要ルート。

```
0-6（SQL学習）
→ 0-7（expo-sqlite確認）
→ 1-2（スキーマ定義）
→ 1-3（DB初期化）
→ 1-4〜1-7（CRUD実装）
→ 2-1（タブバー骨格）
→ 2-4（曲登録フォーム）
→ 2-6（点数入力）
→ 2-9（グラフ）
→ 3-3（EAS Build）
→ 4-4（申請）
```

---

## 10. リスクと対策

| リスク | 対策 |
|---|---|
| Victory Native（→ gifted-charts採用済み） | react-native-gifted-charts を使用中。data/data2で2系列対応 |
| expo-sqliteの外部キー制約が動かない | `PRAGMA foreign_keys = ON` を起動時に必ず実行 |
| EAS Buildでエラーが出る | `eas build --platform ios --profile development` から試す |
| Apple Developer審査に時間がかかる | Phase 0の段階で申請開始 |
| 初学者バッファ | 90hの見積もりに対し実際は1.5〜2倍（12〜18週）を想定 |

---

## 11. 実装済み機能（MVP完了）

以下はすべて実装・動作確認済み：

| 機能 | 実装内容 |
|---|---|
| iTunes Search API連携 | 曲名・アーティスト名補完、アルバムアート取得（1文字以上で発火） |
| 機種選択（DAM / JOYSOUND） | オンボーディング・記録時・設定画面で選択可。セッション記憶付き |
| メモ機能 | 曲登録・編集フォームに自由入力欄。詳細画面に表示 |
| 重複登録チェック | 同名曲登録時に確認ダイアログ（大文字小文字・スペース無視） |
| バックアップ（JSONエクスポート） | 全テーブルをJSON書き出し・共有シートで保存先選択 |
| 詳細画面アートワーク | 曲詳細にiTunesアートワーク64x64表示（fallback: 🎵） |
| グラフ（DAM/JOYSOUND 2系列） | gifted-charts の data/data2 でマシン別色分け折れ線 |

## 12. 今後の対応候補

- バックアップの復元（インポート）機能
- Android対応
- App Store申請・公開

---

*このファイルはプロジェクトルート `CLAUDE.md` として配置されている。旧版は `docs/instructions/CLAUDE.md` に保存。*
