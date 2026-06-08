# セッション作業報告 — 2026-05-31

## 概要

`t-new` ブランチ（PR #8）にて、実装指示書 `implementation-guide-v1.0-final.md` に定義された **T1〜T9 の全タスクを完了**した。
マージ後、`main` ブランチはクリーンな状態。

---

## 完了タスク一覧（T1〜T9）

### T1：マイグレーション機構の整備

**コミット**: `a2f09c1 feat: マイグレーション機構を導入`

- `src/db/migrations/index.ts` を新規作成
- `Migration` 型 + `MIGRATIONS` 配列 + `runMigrations(db)` 関数を実装
- `db_version` テーブルでスキーマバージョンを管理（トランザクション内で実行・失敗時ロールバック）
- `src/db/client.ts` の `initDatabase()` から `runMigrations` を呼び出す構成

---

### T2：メモ欄実装

**コミット**: `4471bae feat: songsテーブルにmemoカラムを追加`

- マイグレーション v1：`ALTER TABLE songs ADD COLUMN memo TEXT NOT NULL DEFAULT ''`
- `src/db/schema.ts` の `CREATE TABLE songs` にも `memo` カラムを追加（新規インストール用）
- `src/types/index.ts` の `SongRow` に `memo: string` を追加
- `insertSong` / `updateSong` 関数に `memo` 引数を追加
- 登録・編集画面（`app/song/new.tsx`）にメモ入力欄（`multiline`）を追加
- 詳細画面（`app/song/[id].tsx`）にメモ表示エリアを追加（空の場合は非表示）

---

### T-NEW：機種選択機能

**コミット**:
- `128cfb0 feat: settingsテーブルを作成`
- `0bba9d9 feat: scoresテーブルにmachineカラムを追加`
- `c9163f1 feat: 機種ストア層とMachineContextを実装`
- `14c8b96 feat: 機種選択UIを実装（オンボーディング・記録・編集・設定・詳細画面）`

**データ層**:
- マイグレーション v2：`settings` テーブル作成（key-value形式）
- マイグレーション v3：`scores.machine TEXT NOT NULL CHECK(IN 'DAM','JOYSOUND')` 追加（既存データ全削除の上追加）
- `src/db/settings.ts`：`getSetting` / `setSetting` / `deleteSetting` 実装
- `src/lib/machine.ts`：`Machine` 型、デフォルト機種・セッション機種ロジック実装
  - セッション機種は `session_machine` + `session_date` で当日限り記憶（翌日は default に戻る）
  - 日付比較はローカルタイムゾーン基準（`toISOString().slice(0,10)` は UTC なので使わない）
- `src/contexts/MachineContext.tsx`：`MachineProvider` + `useMachine` フック実装

**UI層**:
- `app/onboarding.tsx`：初回セットアップ画面（DAM/JOYSOUND選択 → ホームへ）。`isOnboardingCompleted()` が false なら `_layout.tsx` から強制遷移
- `src/components/ScoreBottomSheet.tsx`：点数記録・編集ボトムシートに機種トグルを追加。記録時は `setSessionMachine` 呼び出し、編集時はセッションに影響しない
- `app/settings/machine.tsx`：デフォルト機種選択サブ画面（06画面）を新規作成
- `app/(tabs)/settings.tsx`：「カラオケ機種」セクション追加
- `app/song/[id].tsx`：履歴行に機種バッジ（DAM = 青系 / JOYSOUND = 橙系）追加。gifted-charts の `data` / `data2` で2系列折れ線グラフを実装（データ0件の系列は非表示・凡例にも出さない）

---

### T3：重複登録チェック

**コミット**:
- `18bf5ac feat: 曲の重複判定関数を実装`
- `6fbf2bb feat: 曲登録時の重複チェック警告を実装`

- `src/db/songs.ts` に `findDuplicateSong(title, artist)` を追加（LOWER + TRIM で正規化）
- `app/song/new.tsx` の `handleSave` で保存前に重複チェック。重複時は `Alert.alert` で確認ダイアログ（「それでも登録する」で継続可）
- 編集モード時はスキップ

---

### T4：fix-D（pausedRef リセット + null安全化）

**コミット**: `cc07438 fix: 編集モード起動時のpausedRefリセット漏れを修正`

- `app/song/new.tsx`：編集モード起動の `useEffect` 内で `pausedRef.current = false` を明示的にセット
- `song.tabs?.map((t) => t.id) ?? []` に変更（optional chaining 化）

---

### T5：fix-C（iTunes検索 最小文字数 2→1）

**コミット**: `e9a0e44 fix: iTunes検索の最小文字数を2→1に変更`

- `src/hooks/useMusicSearch.ts`：`query.trim().length < 2` → `query.trim().length < 1` に変更

---

### T6：詳細画面アートワーク表示

**コミット**: `99243fa feat: 曲詳細画面にアートワーク表示を追加`

- `app/song/[id].tsx`：ヘッダーに 64×64 アートワーク表示を追加
- `artwork_url` が null の場合は `🎵` プレースホルダー
- 画像読み込み失敗時のフォールバック処理あり

---

### T7〜T8：バックアップ機能

**コミット**:
- `98b3063 chore: expo-sharing・expo-file-systemを追加（バックアップ機能の前提）`
- `d1b4e2b feat: バックアップ用JSON構築関数を実装`
- `bc00b38 feat: 設定画面にバックアップ書き出しボタンを追加`

- `expo-sharing` + `expo-file-system` を追加
- `src/lib/backup.ts`：
  - `buildBackupJson()`：全テーブルをJSON化。settings はホワイトリスト方式（`default_machine` と `onboarding_completed` のみ。`session_machine` / `session_date` は除外）
  - `exportBackup()`：JSON を `cacheDirectory` に書き出し → `Sharing.shareAsync` で共有シート起動
- `app/(tabs)/settings.tsx`：「データ管理」セクションに「バックアップを書き出す」ボタンを追加（ローディング表示・エラーハンドリング込み）

---

### T9：ドキュメント整合性修正

**コミット**: `d3206f6 docs: CLAUDE.md を現状実装に合わせて更新`

- `docs/instructions/CLAUDE.md` を現状実装と整合させた
- グラフライブラリ・iTunes API・memo・マイグレーション機構・settings・機種選択・バックアップ・重複チェックを反映
- AsyncStorage 不使用の方針を明記
- セクション11「実装済み機能」・セクション12「今後の対応候補」を追加

---

## 現在の状態

### ブランチ / コミット

- ブランチ：`main`
- 最新コミット：`dbb1b3b Merge pull request #8 from Rengemaru/t-new`
- ステータス：クリーン（未コミット変更なし）

### 確定スキーマ（現行 schema.ts）

```sql
CREATE TABLE IF NOT EXISTS tabs (id, name, sort_order)
CREATE TABLE IF NOT EXISTS songs (id, title, artist, key_offset, artwork_url, memo, created_at)
CREATE TABLE IF NOT EXISTS song_tabs (song_id FK, tab_id FK)
CREATE TABLE IF NOT EXISTS scores (id, song_id FK, score, scored_at, machine CHECK('DAM','JOYSOUND'))
CREATE TABLE IF NOT EXISTS settings (key PK, value)
-- マイグレーション管理テーブル（initDatabase時に自動作成）
CREATE TABLE IF NOT EXISTS db_version (version)
```

**マイグレーション状態**：v1（memo列）→ v2（settings）→ v3（scores.machine）まで定義済み

### settings テーブル キー一覧

| key | 内容 |
|---|---|
| `default_machine` | デフォルト機種（DAM / JOYSOUND）|
| `onboarding_completed` | 初回起動完了フラグ（"true"）|
| `session_machine` | セッション中の機種（バックアップ対象外）|
| `session_date` | セッション日付 YYYY-MM-DD（バックアップ対象外）|

### パッケージ（主要）

```json
"expo": "~54.0.34",
"expo-router": "~6.0.23",
"expo-sqlite": "~16.0.10",
"expo-sharing": "~14.0.8",
"expo-file-system": "~19.0.23",
"react-native-gifted-charts": "^1.4.77"
```

---

## 今後の対応候補（優先度順）

1. **バックアップの復元（インポート）機能**
   - JSON ファイルを読み込み、テーブルに書き戻す
   - スキーマバージョンの整合確認が必要
2. **App Store 申請・公開**（iOS）
   - EAS Build → TestFlight → App Store Connect への流れ
   - プライバシーポリシー作成が必要
3. **Android 対応**（Google Play）
   - `app.json` に `android.package` = `com.rengemaru.mykara` は設定済み
   - `google-services-key.json` の作成が未対応

---

## 引き継ぎ事項・注意点

- **AsyncStorage は使用禁止**。永続化はすべて `src/db/settings.ts` 経由で行う
- `PRAGMA foreign_keys = ON` は `initDatabase()` 内で実行済み（接続のたびにリセットされるため必須）
- 「すべて」タブは DB に持たず `ALL_TAB = { id: -1 }` でコード固定。削除・編集 UI に出さない
- 曲削除時は `scores` / `song_tabs` も CASCADE 削除される（確認ダイアログ必須）
- `scores.machine` に DEFAULT はない。指定漏れは SQLite 側でエラーになる設計（意図的）
- 新しいカラム・テーブルを追加する際は必ず `src/db/migrations/index.ts` の `MIGRATIONS` 配列にエントリを追加する
- `git push` はユーザーが判断して実行する（Claude Code は push しない）
