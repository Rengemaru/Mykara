# MyKara — Claude Code 指示書（2026-05-26 更新版）

> **このファイルはClaude Codeへの完全な指示書です。**
> 実装の前に必ずこのファイル全体を読んでから作業を開始してください。

> **現在のフェーズ**: Phase 4（Google Play 公開作業中）
> Phase 0〜3（環境構築・データ層・UI実装・統合テスト）は**完了済み**です。

---

## 0. プロジェクト概要

| 項目 | 内容 |
|---|---|
| アプリ名 | MyKara |
| 概要 | カラオケの持ち歌・点数を管理するモバイルアプリ |
| 現在のターゲット | **Google Play（Android）で先行公開** |
| 将来のターゲット | App Store（iOS）※後続フェーズで対応 |
| 開発OS | Windows |
| 優先順位 | 品質 > 納期 > コスト |

---

## 1. 確定技術スタック

| 役割 | 選定 |
|---|---|
| フレームワーク | React Native + Expo（SDK 54） |
| 画面遷移 | expo-router v3 |
| ローカルDB | expo-sqlite |
| グラフ | Victory Native |
| 曲情報補完 | iTunes Search API（実装済み） |
| ビルド | EAS Build |
| 提出 | EAS Submit |
| 言語 | TypeScript（strict mode） |

---

## 2. ディレクトリ構成

```
mykara/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx             # ホーム（曲一覧）
│   │   └── settings.tsx          # 設定
│   ├── song/
│   │   ├── [id].tsx              # 曲詳細
│   │   └── new.tsx               # 曲登録・編集（モーダル）
│   └── _layout.tsx
├── src/
│   ├── api/
│   │   └── itunesSearch.ts       # iTunes Search API クライアント
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   ├── songs.ts
│   │   ├── tabs.ts
│   │   ├── scores.ts
│   │   └── songTabs.ts
│   ├── types/
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSongs.ts
│   │   ├── useSongDetail.ts
│   │   ├── useTabs.ts
│   │   └── useMusicSearch.ts     # iTunes API 検索フック
│   └── components/
│       ├── SongCard.tsx
│       ├── ScoreBottomSheet.tsx
│       ├── KeyStepper.tsx
│       └── ScoreChart.tsx
├── assets/
│   └── adaptive-icon/            # Android アダプティブアイコン（設定済み）
├── docs/
│   └── wireframes/
│       └── wireframe_v3.html     # 画面設計の基準（参照用）
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

---

## 3. データ設計（確定・変更不可）

### 3-1. テーブル定義

```sql
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
```

### 3-2. 設計方針

| 項目 | 決定内容 |
|---|---|
| 曲↔タブの関係 | 多対多。1曲が複数タブに属せる |
| スコアの型 | REAL（小数・整数どちらも対応） |
| 「すべて」タブ | DBに持たずコードで固定定義（`ALL_TAB = { id: -1 }`）。削除・編集不可 |
| タブ | 自由記述・カスタム命名 |
| 曲削除時 | scores・song_tabs も連鎖削除（ON DELETE CASCADE） |
| タブ削除時 | song_tabs の該当行のみ削除。曲自体は残る |

---

## 4. 実装済み機能（変更前に必ず確認）

以下はすでに動作しています。**理由なく変更しないこと。**

### 曲管理
- 曲の登録・編集・削除（左スワイプ）
- タブ（カテゴリ）の作成・編集・削除
- 曲↔タブの多対多紐づけ
- キー（音域）ステッパー

### スコア管理
- 点数の手入力（テンキー UI）
- 日付ナビゲーション（‹/›ボタンで1日単位変更、未来日付は不可）
- スコア履歴の編集・削除（左スワイプ）
- 点数推移グラフ（Victory Native / VictoryLine）

### 曲カードのスコア表示ルール（確定仕様）
```typescript
// best_score のみ表示。0点は「—」表示（仕様通り・変更禁止）
const score = song.best_score;
{score != null && score > 0 ? score.toFixed(1) : '—'}
```

### iTunes Search API
- 曲名フィールド: `attribute=songTerm` で検索
- アーティスト名フィールド: `attribute=artistTerm` で検索
- サジェスト選択後の再検索防止: `pausedRef` フラグで制御
- abort 競合対策: ローカル変数 `controller` で管理

### Android 対応（実装済み）
- ステータスバー制御
- `KeyboardAvoidingView`（`behavior="height"`）
- `Modal`（Android互換）
- スプラッシュ画面
- アダプティブアイコン（foreground / background / monochrome）

---

## 5. 未適用バグ修正（後回し・将来対応）

以下の修正は `fix/bug-fixes-after-review` ブランチで実装されたが、
drag-reorder機能のrevertと一緒に取り消されました。
**Google Play 公開後に別ブランチで再適用すること。**

| fix | 内容 | 対象ファイル |
|---|---|---|
| fix-C | iTunes検索の最小文字数を 2→1 に変更（1文字のアーティスト名対応） | `src/hooks/useMusicSearch.ts` |
| fix-D | 編集モード起動時に `pausedRef` をリセット・`song.tabs` の nullチェック追加 | `app/song/new.tsx` |
| fix-E | `react-native-reanimated` を Expo SDK 54 互換バージョン（`~4.1.1`）に固定 | `package.json` |

---

## 6. app.json の Android 設定（確認済み）

```json
{
  "android": {
    "package": "com.rengemaru.mykara",
    "versionCode": 1,
    "permissions": ["android.permission.INTERNET"],
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundImage": "./assets/adaptive-icon-background.png",
      "monochromeImage": "./assets/adaptive-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  }
}
```

---

## 7. eas.json の設定（確認済み）

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "internal"
      }
    }
  }
}
```

> ⚠️ `track: "internal"` は内部テスト配布の設定です。
> 一般公開時は `"track": "production"` に変更が必要です。

---

## 8. デザイントークン

```typescript
const colors = {
  accent:      '#5b4cf5',
  accentSoft:  'rgba(91, 76, 245, 0.10)',
  green:       '#00b96b',
  yellow:      '#f59e0b',
  red:         '#ef4444',
  text:        '#111827',
  text2:       '#6b7280',
  text3:       '#9ca3af',
  bg:          '#f0f2f7',
  surface:     '#f7f8fc',
  surface2:    '#eef0f6',
  border:      'rgba(0, 0, 0, 0.07)',
  white:       '#ffffff',
};

// フォント
// - Plus Jakarta Sans: 見出し・アプリタイトル
// - Noto Sans JP: 本文・日本語
// - DM Mono: 数字・スコア表示
```

---

## 9. 実装ルール（厳守）

```
1. TypeScript strict mode を必ず有効にする（tsconfig.json の "strict": true）
2. any 型は使用禁止。型が不明なときは unknown を使い、型ガードで絞る
3. DB操作関数はすべて src/db/ に集約する（画面から直接DBを叩かない）
4. カスタムフック（src/hooks/）でDBアクセスとUIロジックを分離する
5. コンポーネントは1ファイル1コンポーネント
6. マジックナンバーは定数化する（例: const MAX_SCORE = 100）
7. 削除操作は必ず確認ダイアログを挟む
8. エラー発生時は console.error でログを出し、UIにもエラーメッセージを表示する
9. PRAGMA foreign_keys = ON をアプリ起動時に必ず実行する（expo-sqliteは接続ごとにリセットされる）
```

### 「すべて」タブのルール

```typescript
export const ALL_TAB = { id: -1, name: 'すべて', sort_order: -1 } as const;
// id が -1 のときは getAllSongs() を使う
// id が -1 のタブは削除・編集UIに表示しない
```

---

## 10. Git 運用ルール

```
- 1タスク完了ごとに必ずコミットする
- コミットメッセージ形式: [タスクNo] 日本語で内容を説明
- ブランチ戦略:
    メイン作業: main ブランチ
    バグ修正:   fix/*** ブランチを切ってPRを作成
    機能追加:   feature/*** ブランチを切ってPRを作成
- google-services-key.json は .gitignore に追加済み。絶対にコミットしない
```

---

## 11. Phase 4: Google Play 公開（現在進行中）

### 残タスク一覧

| # | タスク | 状態 | 備考 |
|---|---|---|---|
| 4-A | Google Play デベロッパーアカウント登録 | ⚠️ 未完了 | $25・承認に数日かかる場合あり。**最優先** |
| 4-B | `google-services-key.json` の取得と配置 | ⚠️ 未完了 | Google Play Console → APIアクセス → サービスアカウント作成 → JSONキー配置 |
| 4-C | Google Play Console でアプリ新規作成 | ⚠️ 未完了 | パッケージ名: `com.rengemaru.mykara` |
| 4-D | ストア掲載素材の準備 | ⚠️ 未完了 | スクショ最低2枚・フィーチャーグラフィック1024×500px・説明文 |
| 4-E | コンテンツレーティング（アンケート回答） | ⚠️ 未完了 | Google Play Console 内で完結 |
| 4-F | プライバシーポリシーの作成・URL設定 | ⚠️ 未完了 | 審査で必須。無料ツールで作成可能 |
| 4-G | データ安全性の回答 | ⚠️ 未完了 | ネット通信あり・個人情報収集なし |
| 4-H | EAS Build（AAB形式） | ⚠️ 未完了 | `eas build --platform android --profile production` |
| 4-I | EAS Submit（内部テスト配布） | ⚠️ 未完了 | `eas submit --platform android --profile production` |
| 4-J | 内部テストで動作確認 | ⚠️ 未完了 | 実機でひと通り操作 |
| 4-K | 一般公開（track を production に変更） | ⚠️ 未完了 | 内部テスト確認後 |

### ビルド・提出コマンド

```powershell
# AABビルド（Google Play必須形式）
eas build --platform android --profile production

# ストアへ提出（内部テスト）
eas submit --platform android --profile production
```

### `google-services-key.json` の取得手順

1. Google Play Console → 設定 → APIアクセス
2. Googleサービスアカウントを新規作成
3. 権限: 「リリースマネージャー」を付与
4. JSONキーをダウンロード
5. プロジェクトルートに `google-services-key.json` として配置
6. `.gitignore` に追加済みであることを確認

---

## 12. 将来フェーズ（今は対応しない）

### Phase 5: iOS / App Store 公開
- Apple Developer Program 登録（年額 $99）
- EAS Build（iOS）
- TestFlight での動作確認
- App Store Connect セットアップ・審査申請

### Phase 6: 機能追加（未確定）
- 機種タグ（DAM / JOYSOUND）
- メモ機能
- データエクスポート（CSV等）
- 曲の並び替え（drag-reorder）※過去に実装・バグのため取り消し済み

---

*このファイルはプロジェクトルートに `CLAUDE.md` として配置すること。*
*Claude Code は起動時にこのファイルを自動で読み込む。*
