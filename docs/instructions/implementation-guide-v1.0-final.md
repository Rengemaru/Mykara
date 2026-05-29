# 🛠 実装指示書 FINAL：歌帳（うたちょう）v1.0 公開前 実装タスク一式

> 作成日：2026-05-27
> バージョン：v1.0-FINAL（機種選択機能 T-NEW を含む統合版）
> 依頼者：プロジェクトオーナー
> 対象：Claude Code（実装担当）
> 期間目標：17〜25時間（実作業）

---

## 🚨 全タスク共通の絶対ルール

このドキュメント全体に適用されます。**例外なく守ってください。**

### ❌ やってはいけないこと

- 指示にないファイルの修正・リファクタ
- 「ついでに気づいたバグ」の修正（**別途報告するだけ**にとどめる）
- タスク群（T1〜T9）の境目を超えた連続実行
- 動作確認なしでの次タスクへの進行
- 設計判断を独断で行うこと（迷ったら**必ず止まって質問**）
- パッケージのメジャーバージョン更新
- `git push` / リモート操作（コミットまで。pushはユーザーが判断）
- **AsyncStorage の使用**（永続化は全て expo-sqlite の settings テーブルで行う）

### ✅ 必ずやること

- **1サブタスク完了ごとにコミット**（後述のコミット規約に従う）
- コミット前に動作確認（最低限：ビルドが通る・該当機能が動く）
- 仕様の不明点は **テックリード（チャット側Claude）への質問** として停止
- タスク群（T1, T2...）の最後で停止し、ユーザーの確認を待つ

### 📝 コミットメッセージ規約

Conventional Commits 形式：

```
<type>: <subject>

<body>（任意）
```

**type の使い分け**：
- `feat`: 新機能追加
- `fix`: バグ修正
- `refactor`: 動作を変えないリファクタ
- `chore`: 設定・パッケージ等の雑務
- `docs`: ドキュメントのみの変更

---

## 🗺️ 全体WBS（依存関係マップ）

```
T1: マイグレーション機構整備（基盤）
 │
 ├─→ T2: メモ欄実装（T1の初回利用ケース）
 │     │
 │     └─→ T-NEW: 機種選択機能（T1・T2完了後）
 │           │
 │           ├─→ T3: 重複登録チェック
 │           ├─→ T4: fix-D
 │           ├─→ T5: fix-C
 │           └─→ T6: 詳細画面アートワーク
 │
 └─→ T7: バックアップ前提パッケージ導入
       │
       └─→ T8: バックアップ機能（settings含む全テーブル）

T9: ドキュメント整合性修正（最後）
```

**重要な依存ルール**：
- T2 は T1 完了が前提
- **T-NEW は T1・T2 完了が前提**（マイグレーション機構と memo 列の例を活用）
- T8 は T-NEW 完了が前提（バックアップに settings テーブル・machine カラムを含めるため）
- T9 は全タスク完了後

---

# 📦 タスク群 T1：マイグレーション機構の整備

> **目標**：DB スキーマのバージョン管理機構を導入
> **方式**：選択肢A（`db_version` テーブル方式）
> **工数目安**：3〜4時間
> **コミット数**：2コミット

## なぜこの方式を選んだか

- 公開後のスキーマ変更で既存ユーザーのデータを壊さないため
- 個人開発でも学習目的を兼ねて本格的な仕組みを導入

## T1.1 マイグレーション機構の設計と実装

### やること

1. `src/db/migrations/` ディレクトリを新規作成
2. `src/db/migrations/index.ts` を作成し、以下を含める：
   - `Migration` 型の定義
     ```typescript
     export type Migration = {
       version: number;
       description: string;
       up: (db: SQLiteDatabase) => Promise<void>;
     };
     ```
   - `MIGRATIONS` 配列（初期は空配列でOK）
   - `runMigrations(db)` 関数：以下の処理を行う
     - `db_version` テーブルがなければ作成
     - 現在のバージョンを取得（レコードがなければ `0` 扱い）
     - `MIGRATIONS` 配列を走査し、現在バージョン超の `up()` を順次実行
     - 各マイグレーション成功後、`db_version` を更新（**トランザクション内**）
     - エラー時はロールバックして例外を投げる
3. `src/db/schema.ts` の DB 初期化処理を修正：
   - 既存の `CREATE TABLE IF NOT EXISTS` 群はそのまま残す
   - その後に `runMigrations(db)` を呼ぶ
4. 実行ログを残す：
   - 「現在のDBバージョン: X」
   - 「マイグレーション Y を適用中: <description>」
   - 「マイグレーション完了」または「マイグレーション不要」

### 動作確認

- アプリを起動して、エラーが出ないこと
- `db_version` テーブルが作成されていること
- 何回起動してもエラーなく、バージョンが安定していること（冪等性）
- コンソールに想定通りのログが出ること

### コミット

```
feat: マイグレーション機構を導入

db_versionテーブルでスキーマバージョンを管理する仕組みを追加。
MIGRATIONS配列にエントリを足すことで、起動時に順次マイグレーションが
適用される。トランザクション内で実行し、失敗時はロールバックする。
実行ログをコンソール出力する。
```

## T1.2 動作検証（コミットなし・確認のみ）

### やること

1. `MIGRATIONS` 配列に**テスト用のno-opエントリ**を一時的に追加：
   ```typescript
   { version: 1, description: 'test: dry-run', up: async () => {} }
   ```
2. アプリ起動 → `db_version` が `0 → 1` に更新されることをログで確認
3. 再起動 → エラーなく起動・バージョンが `1` のまま
4. **確認後、追加したエントリを削除**（`MIGRATIONS` 配列を空に戻す）
5. エミュレータのアプリデータをクリアして、`db_version` を `0` に戻す
   - Windowsコマンド例（Android）：`adb shell pm clear com.rengemaru.utacho`
   - またはエミュレータの設定からアプリデータをクリア

### 動作確認

- 検証完了後、`MIGRATIONS` 配列が空・DB の `db_version` が初期状態に戻っていること

### コミット

**コミットしない**（一時的な検証作業のため）

## ✅ T1 完了条件

- マイグレーション機構が動作する
- `MIGRATIONS` 配列が空でもアプリが正常起動する
- 次に追加するマイグレーション（T2.1）の受け皿が整っている

**T1 完了したら一度停止し、ユーザーに完了報告してください。**

---

# 📦 タスク群 T2：メモ欄実装

> **目標**：曲ごとにフリーテキストのメモを保存・表示
> **前提**：T1 完了
> **工数目安**：2〜3時間
> **コミット数**：3コミット

## T2.1 メモ列追加マイグレーション

### やること

1. `src/db/migrations/index.ts` の `MIGRATIONS` 配列に以下を追加：
   ```typescript
   {
     version: 1,
     description: 'add memo column to songs',
     up: async (db) => {
       await db.execAsync(
         `ALTER TABLE songs ADD COLUMN memo TEXT NOT NULL DEFAULT ''`
       );
     }
   }
   ```
2. `src/db/schema.ts` の `CREATE TABLE songs` 文にも `memo` カラムを追加（新規インストール時用）

### 動作確認

- アプリ起動でマイグレーション適用ログが出る
- 既存の曲データが消えていない
- 新規曲を登録できる

### コミット

```
feat: songsテーブルにmemoカラムを追加

マイグレーションv1としてmemoカラムを追加。新規インストール時は
schema.tsから直接作成され、既存ユーザーはマイグレーションで自動追加される。
```

## T2.2 型定義と DB アクセス層の更新

### やること

1. `Song` 型に `memo: string` を追加
2. `insertSong` / `updateSong` 関数の引数に `memo` を追加
3. `getAllSongs` / `getSongById` の SELECT 文に `memo` を含める
4. デフォルト値は `''`

### 動作確認

- TypeScript 型エラーなし（`npx tsc --noEmit`）

### コミット

```
feat: Song型・DB関数にmemoフィールドを追加

insertSong/updateSongのシグネチャを変更し、memoを受け取れるようにする。
SELECT系もmemoを含めるよう更新。
```

## T2.3 UI実装：登録・編集画面にメモ入力欄、詳細画面に表示

### やること

1. **登録・編集画面**（`app/song/new.tsx`）
   - キー入力欄の下にメモ入力欄を追加
   - `TextInput` の `multiline={true}`、`numberOfLines={3}`
   - プレースホルダ：「メモ（自由入力）」
2. **詳細画面**（`app/song/[id].tsx`）
   - スコア履歴・グラフの上または下にメモ表示エリアを追加
   - メモが空（`''`）の場合は**表示しない**（要素ごと非表示）
   - 表示はテキストのみ。改行は反映する

### 動作確認

- 新規登録時にメモが保存される
- 既存曲の編集でメモを追記・修正できる
- 詳細画面にメモが表示される（空なら非表示）
- 改行が反映される

### コミット

```
feat: 曲のメモ欄UIを実装

登録・編集画面にメモ入力欄（複数行）を追加。詳細画面でメモを表示
（空の場合は非表示）。
```

## ✅ T2 完了条件

- メモの登録・編集・表示が動作
- 既存曲データに影響なし
- TypeScript エラーなし

**T2 完了したら一度停止し、ユーザーに完了報告してください。**

---

# 📦 タスク群 T-NEW：機種選択機能

> **目標**：点数記録時にDAM/JOYSOUNDを必須選択。セッション記憶付き。詳細画面のグラフを2系列化。
> **前提**：T1・T2 完了
> **工数目安**：4.5〜6時間
> **コミット数**：4コミット

## なぜこのタイミングか

- マイグレーション機構（T1）が確立していて、`scores` テーブルへの列追加が安全にできる
- T2 で memo 列追加の前例ができている
- T-NEW で `settings` テーブルを導入すると、T8（バックアップ）でそれも含めて出力する設計になるため、T-NEW は T8 より前

## 🎯 T-NEW 全体の設計判断（事前確認・必読）

実装前に以下の判断をすべて頭に入れてから着手してください：

| 項目 | 決定 |
|---|---|
| 機種値の型 | `type Machine = 'DAM' \| 'JOYSOUND'` |
| 永続化先 | **expo-sqlite の `settings` テーブル**（AsyncStorage不使用） |
| `scores.machine` 制約 | `NOT NULL CHECK (machine IN ('DAM', 'JOYSOUND'))` ・**DEFAULTなし** |
| 既存テストデータ | マイグレーション時に全削除 |
| セッション機種の永続化 | `settings` テーブルに `session_machine` + `session_date` を保存 |
| 状態管理 | React Context（DBが真値・遅延評価で日付チェック） |
| 初回判定 | `settings.onboarding_completed` の存在で判定 |
| グラフ多系列 | gifted-charts の `data` / `data2`。データ0件の系列は非表示・凡例にも出さない |

## T-NEW.1 settings テーブル作成マイグレーション

### やること

1. `src/db/migrations/index.ts` の `MIGRATIONS` 配列に以下を追加：
   ```typescript
   {
     version: 2,
     description: 'create settings table',
     up: async (db) => {
       await db.execAsync(`
         CREATE TABLE settings (
           key   TEXT PRIMARY KEY,
           value TEXT NOT NULL
         )
       `);
     }
   }
   ```
2. `src/db/schema.ts` にも `CREATE TABLE IF NOT EXISTS settings` を追加（新規インストール用）

### 動作確認

- アプリ起動でマイグレーション v2 適用ログが出る
- `settings` テーブルが作成されていること

### コミット

```
feat: settingsテーブルを作成

マイグレーションv2でsettingsテーブル（key-value形式）を追加。
default_machine, onboarding_completed, session_machine, session_date
などの設定値を一元管理する。AsyncStorageは使わない方針。
```

## T-NEW.2 scores.machine 追加マイグレーション

### やること

1. `MIGRATIONS` 配列に以下を追加：
   ```typescript
   {
     version: 3,
     description: 'add machine column to scores (delete existing test data)',
     up: async (db) => {
       // 既存テストデータを削除（テストデータのみという前提）
       await db.execAsync(`DELETE FROM scores`);
       // machine カラムを追加（DEFAULT なし、CHECK 制約付き）
       await db.execAsync(`
         ALTER TABLE scores ADD COLUMN machine TEXT NOT NULL 
         CHECK (machine IN ('DAM', 'JOYSOUND'))
       `);
     }
   }
   ```
2. `src/db/schema.ts` の `CREATE TABLE scores` 文に `machine` カラムを追加

### ⚠️ 注意

- ALTER TABLE で NOT NULL カラムを追加する場合、**既存行があるとエラーになる**
- そのため、先に `DELETE FROM scores` で既存データを削除している
- 「既存データは全削除でOK」は **確定済み仕様**

### 動作確認

- アプリ起動でマイグレーション v3 適用ログが出る
- 既存の点数データが削除されていること
- 新しい点数を登録しようとすると、まだUIがないのでエラーになる可能性あり（T-NEW.3 / T-NEW.4 で対応）

### コミット

```
feat: scoresテーブルにmachineカラムを追加

マイグレーションv3。既存テストデータを削除した上で、machineカラムを
追加（NOT NULL CHECK制約・DEFAULTなし）。指定漏れバグはSQLite側で
エラーになる設計。
```

## T-NEW.3 機種ストア層の実装（Settings DAO + React Context）

### やること

1. **`src/db/settings.ts` を新規作成**：settings テーブルへの CRUD ユーティリティ
   ```typescript
   // 概念コード
   export async function getSetting(key: string): Promise<string | null>;
   export async function setSetting(key: string, value: string): Promise<void>;
   export async function deleteSetting(key: string): Promise<void>;
   ```
   - 内部で `db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key)` などを使う

2. **`src/lib/machine.ts` を新規作成**：機種ロジック
   ```typescript
   export type Machine = 'DAM' | 'JOYSOUND';
   
   export const MACHINES: readonly Machine[] = ['DAM', 'JOYSOUND'];
   
   // 初回起動かどうか
   export async function isOnboardingCompleted(): Promise<boolean>;
   export async function completeOnboarding(): Promise<void>;
   
   // デフォルト機種
   export async function getDefaultMachine(): Promise<Machine>;  // 未設定なら 'DAM'
   export async function setDefaultMachine(m: Machine): Promise<void>;
   
   // セッション機種（日付チェック込み・遅延評価）
   export async function getCurrentMachine(): Promise<Machine>;
   //   1. session_date を読む
   //   2. 今日と一致しなければ session_machine は無視 → default_machine を返す
   //   3. 一致するなら session_machine を返す
   //   4. session_machine が null なら default_machine を返す
   
   export async function setSessionMachine(m: Machine): Promise<void>;
   //   session_machine と session_date を今日の日付で保存
   ```

3. **`src/contexts/MachineContext.tsx` を新規作成**：React Context
   ```typescript
   // 概念コード
   type MachineContextValue = {
     currentMachine: Machine;
     setCurrentMachine: (m: Machine) => Promise<void>;
     refresh: () => Promise<void>;
   };
   ```
   - `MachineProvider` がアプリ root（おそらく `app/_layout.tsx`）でラップ
   - 起動時に `getCurrentMachine()` を呼んで初期値を設定
   - `setCurrentMachine` が呼ばれたら `setSessionMachine` を経由してDBに保存・state も更新

4. **`app/_layout.tsx` で MachineProvider を導入**

### ⚠️ 実装時に止まって質問すべきこと

- `Date` の扱い（タイムゾーン）：日付比較は **端末ローカルタイムゾーン** で行う
  - `YYYY-MM-DD` 形式の文字列で比較するのが安全
  - 例：`new Date().toISOString().slice(0, 10)` は UTC 基準なのでNG → 別の方法を使う
- もし設計上の判断に迷ったら、止まって質問してください

### 動作確認

- TypeScript エラーなし
- `getDefaultMachine()` がデフォルト 'DAM' を返す
- `setDefaultMachine('JOYSOUND')` 後に `getDefaultMachine()` が 'JOYSOUND' を返す
- `setSessionMachine('JOYSOUND')` 後の `getCurrentMachine()` が 'JOYSOUND'
- 日付を意図的に古くした session_date のとき、`getCurrentMachine()` が default_machine にフォールバックする

### コミット

```
feat: 機種ストア層とMachineContextを実装

settings DAO、機種ロジック（デフォルト/セッション機種・オンボーディング判定）、
React Contextを実装。セッション機種は日付が変わったらリセットされる
（遅延評価・DB上にsession_date保存）。
```

## T-NEW.4 UI実装：オンボーディング・点数記録/編集・設定・詳細画面

### やること

このサブタスクは大きいため、**画面ごとに段階的に動作確認しながら進める**こと。

#### (a) 初回セットアップ画面（新規）

1. `app/onboarding.tsx` を新規作成（または `app/(onboarding)/machine.tsx` 等、好みのルーティング）
2. `app/_layout.tsx` または root ガードで、`isOnboardingCompleted()` が `false` ならこの画面に強制遷移
3. UI：
   - 「歌帳」ロゴ＋「ようこそ！」
   - 「いつもどちらで歌いますか？」の質問
   - DAM カード / JOYSOUND カード（初期選択：DAM）
   - 「はじめる」ボタン
4. 「はじめる」押下時：
   - `setDefaultMachine(selected)` を呼ぶ
   - `completeOnboarding()` を呼ぶ
   - ホーム画面に遷移
5. ボトムナビ・戻るボタンは非表示（スキップ不可）

#### (b) 点数記録ボトムシート（既存 03 を変更）

1. ボトムシートを開くタイミングで `getCurrentMachine()` を呼んで初期選択を設定
2. スコア表示の直下にトグルを追加：DAM / JOYSOUND
3. トグル下に「※ 今日中はこの機種が記憶されます」ヒント表示
4. トグル切替時：ローカル state のみ更新（保存は「記録する」ボタン押下時）
5. 「記録する」押下時：
   - `setSessionMachine(selected)` を呼ぶ（セッション機種を更新）
   - MachineContext の state も refresh
   - `insertScore` で点数を保存（machine カラム込み）

#### (c) 点数編集ボトムシート（既存 02b を変更）

1. ボトムシートを開くタイミングで、**既存スコアの machine** を初期選択
2. トグル下のヒントは「※ 既存記録の機種を表示。変更してもセッションには影響しない」
3. 「変更を保存する」押下時：
   - `updateScore` で machine カラムも更新
   - **`setSessionMachine` は呼ばない**（編集はセッション記憶に影響しない仕様）

#### (d) 設定画面（既存 05 を変更）

1. 「タブ管理」直下に「カラオケ機種」セクションを追加
2. 「デフォルト機種」行：右側に現在のデフォルト機種を表示・タップで `/settings/machine` に遷移
3. `app/settings/machine.tsx` を新規作成（06画面）：
   - DAM / JOYSOUND の大きめカード表示
   - 現在のデフォルトが選択状態
   - タップで `setDefaultMachine` を呼んで保存
   - 画面下部に「セッション記憶について」の説明文

#### (e) 詳細画面の機種バッジ＆多系列グラフ（既存 02 を変更）

1. **履歴リスト**：
   - 各行に DAM / JOY バッジを表示
   - 配色：DAM = `#0066cc` 系、JOYSOUND = `#f97316` 系
2. **多系列グラフ**：
   - スコアデータを machine ごとにグループ化
   - DAM のデータがあれば青系の線、JOYSOUND のデータがあれば橙系の線
   - **データ0件の機種の線は描画しない・凡例にも出さない**
   - 凡例（Legend）：グラフ右上に色付きドット＋ラベル
3. gifted-charts の API は実装時にドキュメント確認。基本的には `data` と `data2` プロパティで2系列対応

### ⚠️ 実装時に止まって質問すべきこと

- 既存スコアデータが全削除されているので、グラフが空になる。これは仕様通り（テストデータ削除済み）
- 動作確認のため、まず手動で何件か点数を入力（DAM/JOYSOUND混在）してからグラフを確認すること

### 動作確認

- 新規インストール時：オンボーディング画面が出る → DAM 選択 → ホームへ
- 点数記録：機種トグルが現れる・選択して記録できる
- 設定画面：デフォルト機種が表示・変更できる
- 翌日（日付を意図的に変更）に点数記録画面を開いた時、デフォルト機種に戻っている
- 詳細画面：履歴に機種バッジ、グラフが2系列で描画
- DAMのデータしかない曲：JOYSOUND の線は表示されず、凡例にも出ない

### コミット

```
feat: 機種選択UIを実装（オンボーディング・記録・編集・設定・詳細画面）

- 初回セットアップ画面（07）を新規作成
- 点数記録/編集ボトムシート（03/02b）に機種トグルを追加
- 設定画面（05）にカラオケ機種セクションを追加
- デフォルト機種選択サブ画面（06）を新規作成
- 詳細画面（02）に機種バッジと多系列グラフを実装
```

## ✅ T-NEW 完了条件

- 新規インストール時にオンボーディングが表示される
- 点数の記録・編集で機種が必須選択される
- セッション機種が日付ベースで管理される
- 詳細画面に機種バッジ・多系列グラフが表示される
- TypeScript エラーなし

**T-NEW 完了したら一度停止し、ユーザーに完了報告してください。**

---

# 📦 タスク群 T3：重複登録チェック

> **目標**：曲名＋アーティスト名が一致する曲がすでに存在する場合、警告ダイアログを表示
> **前提**：T1〜T-NEW 完了
> **工数目安**：1〜2時間
> **コミット数**：2コミット

## T3.1 重複判定ロジック

### やること

1. `src/db/songs.ts`（または該当する DB アクセス層）に新関数を追加：
   ```typescript
   findDuplicateSong(title: string, artist: string): Promise<Song | null>
   ```
2. 判定基準：
   - 前後スペース除去（`trim()`）
   - 大文字小文字無視（`toLowerCase()`）
   - 両方一致でヒット
3. SQLクエリ例（**プレースホルダ必須**）：
   ```sql
   SELECT * FROM songs
   WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))
     AND LOWER(TRIM(artist)) = LOWER(TRIM(?))
   LIMIT 1
   ```

### コミット

```
feat: 曲の重複判定関数を実装

findDuplicateSong関数を追加。曲名＋アーティスト名で重複検出する。
比較時は前後スペース除去・大文字小文字無視で正規化する。
```

## T3.2 登録時の警告ダイアログ

### やること

1. `app/song/new.tsx` の `handleSave()` を修正
2. 既存の「曲名が空」チェックの後、DB保存の前に重複チェック
3. 編集モード（`isEdit`）の場合はスキップ
4. 重複時の挙動：
   - `Alert.alert()` を使用
   - タイトル：「重複登録」
   - メッセージ：`〇〇（△△）はすでに登録されています。それでも追加しますか？`
   - ボタン：「戻る」（cancel）／「それでも登録する」
   - 「それでも登録する」→ 通常の登録フローを継続

### コミット

```
feat: 曲登録時の重複チェック警告を実装

handleSave()で重複検出時にAlertダイアログで確認。
編集モード時はスキップ。意図的な同名登録（機種違い等）は許容する設計。
```

## ✅ T3 完了条件

- 新規登録時の重複検出が動作
- 編集時にはブロックされない
- スペース・大文字小文字の差で誤検出/見逃しなし

**T3 完了したら一度停止し、ユーザーに完了報告してください。**

---

# 📦 タスク群 T4：fix-D（pausedRef リセット + null安全化）

> **目標**：編集モード起動時の検索無効化バグを修正・null 安全化
> **工数目安**：30分
> **コミット数**：1コミット

## T4.1 fix-D 適用

### やること

1. `app/song/new.tsx` の編集モード起動時 `useEffect` を修正
2. 修正内容：
   - 適切な位置に `pausedRef.current = false` を追加
   - `song.tabs.map((t) => t.id)` を `song.tabs?.map((t) => t.id) ?? []` に変更

### 動作確認

- 既存曲の編集画面を開いて、サジェストが動作
- TypeScript エラーなし

### コミット

```
fix: 編集モード起動時のpausedRefリセット漏れを修正

useEffect内でpausedRef.current = false を明示的にセット。
song.tabsのアクセスをoptional chaining化（型がどちらでも安全）。
```

**T4 完了後、そのまま T5 に進んでよい**

---

# 📦 タスク群 T5：fix-C（iTunes 検索の最小文字数 2→1）

> **目標**：1文字でも検索が走るようにする
> **工数目安**：10分
> **コミット数**：1コミット

## T5.1 fix-C 適用

### やること

1. `src/hooks/useMusicSearch.ts` の 16行目付近
2. `query.trim().length < 2` を `query.trim().length < 1` に変更

### 動作確認

- 1文字検索が動作
- 空文字では検索が走らない

### コミット

```
fix: iTunes検索の最小文字数を2→1に変更

1文字のアーティスト名（例:「B」「布」）でも検索可能にする。
```

**T5 完了後、そのまま T6 に進んでよい**

---

# 📦 タスク群 T6：詳細画面のアートワーク表示

> **目標**：詳細画面ヘッダーにアートワークを表示
> **工数目安**：1〜2時間
> **コミット数**：1コミット

## T6.1 詳細画面ヘッダーにアートワーク

### やること

1. `app/song/[id].tsx` のヘッダー部分にアートワーク表示を追加
2. レイアウト：**ワイヤーフレーム v5 の 02画面参照**
   - 左に正方形アート（64×64程度）、右にラベル
3. `artwork_url` がない場合：`🎵` 絵文字をプレースホルダ表示
4. 画像読み込み失敗時のフォールバック処理

### 実装前に確認

- ワイヤー v5 の 02 画面のレイアウトに準拠
- 詳細はワイヤーフレーム HTML（Notion のリンク先）を確認

### コミット

```
feat: 曲詳細画面にアートワーク表示を追加

一覧画面（SongCard）と同様に、詳細画面ヘッダーにアートワークを表示。
未取得時はプレースホルダ（🎵）にフォールバック。
```

## ✅ T3〜T6 完了条件

- 重複チェック・fix-D・fix-C・詳細画面アートワークがすべて動作
- TypeScript エラーなし

**T6 完了したら一度停止し、ユーザーに完了報告してください。**

---

# 📦 タスク群 T7：バックアップ前提パッケージの導入

> **工数目安**：30分
> **コミット数**：1コミット

## T7.1 パッケージインストール

### やること

1. プロジェクトルートで：
   ```
   npx expo install expo-sharing expo-file-system
   ```
2. `npx expo install` を使うこと（Expo SDK 互換バージョンが自動選択される）
3. インストール後、`package.json` の `dependencies` を確認

### コミット

```
chore: expo-sharing と expo-file-system を導入

バックアップ機能（T8）の前提パッケージ。
```

**T7 完了後、そのまま T8 に進んでよい**

---

# 📦 タスク群 T8：バックアップ機能（JSON エクスポート）

> **目標**：全データを JSON 形式でエクスポートし、iOS/Android 共有シートで保存先を選べる
> **前提**：T7 完了 + settings テーブル（T-NEW.1）が存在
> **工数目安**：4〜6時間
> **コミット数**：3コミット

## T8.1 エクスポート JSON 構築

### やること

1. `src/lib/backup.ts`（新規）に以下を実装：
   - `buildBackupJson(): Promise<string>` を実装
2. JSON 構造：
   ```json
   {
     "version": "1.0",
     "schemaVersion": <現在のdb_version>,
     "exportedAt": "<ISO8601>",
     "settings": [
       { "key": "default_machine", "value": "..." },
       { "key": "onboarding_completed", "value": "true" }
     ],
     "tabs": [...],
     "songs": [...],
     "song_tabs": [...],
     "scores": [...]
   }
   ```
3. **エクスポート対象の制約**：
   - settings：`session_machine` と `session_date` は**除外**する
   - settings：`default_machine` と `onboarding_completed` は**含める**
   - 他のキーが将来増えた場合の方針：ホワイトリスト方式で `default_machine` と `onboarding_completed` のみを含める（除外漏れを防ぐため）
4. 各テーブルは `SELECT * FROM ... ORDER BY id` で取得

### 動作確認

- `console.log(await buildBackupJson())` で正しい構造が出る
- `session_machine` と `session_date` がJSONに含まれない
- `default_machine` と `onboarding_completed` は含まれる

### コミット

```
feat: バックアップ用JSON構築関数を実装

buildBackupJson()で全テーブルのデータをJSON文字列化。
settingsはホワイトリスト方式（default_machineとonboarding_completedのみ）。
session_machine・session_dateは一時状態のため除外。
将来の復元機能のためschemaVersionも含める。
```

## T8.2 ファイル書き出しと共有シート起動

### やること

1. `src/lib/backup.ts` に以下を実装：
   - `exportBackup(): Promise<void>` を実装
2. 処理：
   - `buildBackupJson()` で JSON 文字列を取得
   - `expo-file-system` の `FileSystem.cacheDirectory` に一時ファイルを書き出し
   - ファイル名：`utacho-backup-YYYYMMDD-HHmmss.json`
   - `expo-sharing` の `Sharing.shareAsync(uri)` で共有シートを起動

### 動作確認

- 共有シートが起動する
- 「ファイルに保存」「iCloud Drive」等で保存できる
- 保存されたファイルが正しい JSON 形式

### コミット

```
feat: バックアップファイルの書き出しと共有シート起動

exportBackup()でJSONをcacheDirectoryに書き出し、Sharing.shareAsyncで
共有シートを起動。ユーザーは任意の保存先を選択可能。
```

## T8.3 設定画面にバックアップボタン

### やること

1. `app/(tabs)/settings.tsx` の「データ管理」セクションに「バックアップを書き出す」ボタンを追加
2. ボタン押下で `exportBackup()` を呼ぶ
3. 処理中のローディング表示
4. エラー時：`Alert.alert('エラー', 'バックアップの書き出しに失敗しました')`

### コミット

```
feat: 設定画面にバックアップ書き出しボタンを追加

データ管理セクションにバックアップ機能のUIを実装。
ローディング表示・エラーハンドリング込み。
```

## ✅ T8 完了条件

- 設定画面からバックアップが実行できる
- 共有シートで保存先を選べる
- 出力された JSON が再構築可能な構造

**T8 完了したら一度停止し、ユーザーに完了報告してください。**

---

# 📦 タスク群 T9：ドキュメント整合性修正

> **工数目安**：1時間
> **コミット数**：1コミット

## T9.1 CLAUDE.md の更新

### やること

CLAUDE.md を現状実装に合わせて更新：

1. グラフライブラリ：`Victory Native` → `react-native-gifted-charts`
2. iTunes API 連携：「Phase 2 検討中」→「MVP 実装済み」
3. memo カラム：実装済みとして反映
4. マイグレーション機構：新規セクション追加
5. **settings テーブル**：新規セクション追加（AsyncStorageは使わない方針も明記）
6. **機種選択機能**：実装済みとして反映
7. バックアップ機能：実装済みとして反映
8. 重複登録チェック：実装済みとして反映

### コミット

```
docs: CLAUDE.md を現状実装に合わせて更新

- グラフライブラリ → gifted-charts
- iTunes API・memo・マイグレーション機構・settings・機種選択・
  バックアップ・重複チェックを反映
- AsyncStorage不使用の方針を明記
```

## ✅ T9 完了条件

- CLAUDE.md が現状実装と一致

**T9 完了でこの指示書はすべて完了です。最終報告をユーザーにしてください。**

---

# 📊 タスク全体のチェックリスト（進捗管理用）

```
[ ] T1.1 マイグレーション機構の設計と実装
[ ] T1.2 動作検証（コミットなし）
─── T1 完了報告 ───
[ ] T2.1 memo列追加マイグレーション
[ ] T2.2 型定義とDBアクセス層更新
[ ] T2.3 UI実装（登録・編集・詳細画面）
─── T2 完了報告 ───
[ ] T-NEW.1 settingsテーブル作成マイグレーション
[ ] T-NEW.2 scores.machine追加マイグレーション
[ ] T-NEW.3 機種ストア層とMachineContext
[ ] T-NEW.4 UI実装（オンボーディング・記録・編集・設定・詳細）
─── T-NEW 完了報告 ───
[ ] T3.1 重複判定ロジック
[ ] T3.2 警告ダイアログ
─── T3 完了報告 ───
[ ] T4.1 fix-D 適用
[ ] T5.1 fix-C 適用
[ ] T6.1 詳細画面アートワーク
─── T6 完了報告 ───
[ ] T7.1 パッケージインストール
[ ] T8.1 エクスポート構造設計
[ ] T8.2 ファイル書き出し
[ ] T8.3 設定画面UI
─── T8 完了報告 ───
[ ] T9.1 CLAUDE.md 更新
─── 全タスク完了 ───
```

---

# 🎯 最後に：迷ったら止まる

- 「これってどう実装するんだろう」 → 止まる
- 「ついでにこのコードも直そうかな」 → やらない、別途報告のみ
- 「次のタスクに進んでいいかな」 → 完了報告して、ユーザーの確認を待つ
- 「AsyncStorage を使えば楽そう」 → **使わない**、settings テーブルを使う
- 「DEFAULT 'DAM' を付けておけば安全そう」 → **付けない**、SQLite側で指定漏れを検出させる

慎重さは品質の源です。スピードより正確さを優先してください。
