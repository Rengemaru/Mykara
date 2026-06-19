# タスク指示書：パッケージ名変更 ＋ 旧アプリ名「Mykara」一掃

> 対象リポジトリ：歌帳（うたちょう）/ React Native + Expo (SDK 54)
> 発行日：2026-06-17
> 想定工数：45分以内
> 担当：Claude Code

---

## 0. このタスクの目的と前提

このタスクでは2つを行う：

1. **パッケージ名**を `com.rengemaru.mykara` → **`com.rengemaru.utacho`** に変更する。
2. コード内に残る**旧アプリ名の表示文字列「Mykara / MyKara」を「歌帳」に統一**する。

**前提（重要な理解）**
- まだ Google Play Console へ何もアップロードしていないため、パッケージ名・表示名は**今は自由に変更できる**。
- ロックされるのは「外部サービスに登録した瞬間」だけ。具体的には **Google Play Console への初回AABアップロード（EAS Submit）でパッケージ名が永久固定**される。ビルド自体はロックを引き起こさない。
- したがって、この変更は **`google-services-key.json` 取得・Console アプリ作成より前** に完了させること。

**用語補足**
- **パッケージ名（applicationId）**：OS／ストアがアプリを識別する内部ID。ユーザーには表示されない。アプリ名「歌帳」とは別物。
- **slug**：Expo/EAS がプロジェクトを識別する名前。ビルド連携に使われる。**今回は変更しない**。

---

## 1. Git：作業ブランチを作成（最初に必ず実施）

mainから最新を取得し、専用ブランチを切ってから作業する。

```bash
git checkout main
git pull origin main
git checkout -b chore/rename-to-utacho
```

> 以降の作業はすべてこのブランチ上で行う。**main へ直接コミット・マージしない。**

---

## 2. 事前調査（変更の前に全体を把握する）

旧名の出現箇所を大文字小文字を区別せず洗い出し、**どこに何があるか**を把握する。

```bash
# パッケージID・表示名すべての "mykara" を大小無視で検索
grep -rni "mykara" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.expo

# Expo設定ファイルの形式を確認（どれか1つが存在する）
ls app.json app.config.js app.config.ts 2>/dev/null

# ネイティブディレクトリの有無（prebuild済みかの判定）
ls -d android ios 2>/dev/null
```

検出結果を、後述の**カテゴリA〜Eのどれに当たるか**で仕分けてから変更に入る。

---

## 3. 変更内容（カテゴリ別に処理する）

`mykara` を含む文字列でも、**置換してよいものとダメなものがある**。一律置換は禁止。

### カテゴリA：パッケージ名 → `utacho` に変更【必須】
- `expo.android.package` を **`com.rengemaru.utacho`** にする。

### カテゴリB：iOS bundleIdentifier → `utacho` に揃える【推奨】
- `expo.ios.bundleIdentifier` が `com.rengemaru.mykara` なら **`com.rengemaru.utacho`** にする。
- 理由：iOS は未公開なので今なら無料・無リスクで揃えられる。後回しにすると Android/iOS で別IDになり管理が複雑化する。
- **値が空・未設定なら勝手に追加せず、報告に回す。**

### カテゴリC：表示アプリ名「Mykara / MyKara」→「歌帳」に変更【必須】
ユーザーの目に触れる名称・ドキュメント上の名称を統一する。対象例：
- `expo.name`（アプリのランチャー表示名）→ `歌帳`
- README やドキュメントの見出し・本文中の「Mykara / MyKara」→ `歌帳`
- アプリ内UIに「Mykara」等が文字列としてあれば → `歌帳`
- （もしあれば）ストア説明文ドラフト内の旧名 → `歌帳`

> ASCIIしか使えない箇所（ごく稀）に旧名がある場合は、勝手に日本語化せず報告に回す。

### カテゴリD：据え置き（変更しない）【重要】
`mykara` を含んでいても、以下は**絶対に変更しない**。理由も併記：
- `expo.slug` … EASプロジェクトと紐付くキー。変えると連携警告・ビルドエラーの恐れ。利益ゼロ。
- `expo.extra.eas.projectId` … EASが管理するUUID。手で書き換える対象ではない。
- `expo.version` / `expo.android.versionCode` … バージョン情報。今回と無関係。

### カテゴリE：要確認（自己判断で変えず報告する）
- `expo.scheme` が `mykara` を含む場合（ディープリンク用。影響範囲を要確認）。
- ソースコード内の**識別子**（変数名・関数名・ファイル名、例 `MykaraProvider`）。
  動作には影響しないが、リネームは import 崩壊リスクがある。**原則そのまま**にし、リストだけ報告。

### カテゴリF：ネイティブ（`android/` が存在する場合のみ）
- `expo prebuild` 済みでネイティブが commit されているなら、
  `android/app/build.gradle` の `applicationId` も `com.rengemaru.utacho` に揃える。
- `android/` が無ければ何もしない（Expo managed 運用のため通常は不要）。

---

## 4. 検証（変更後）

```bash
# 残存チェック：表示名・パッケージIDの旧名が消えているか
grep -rni "mykara" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.expo
```

- 上記で**残ってよいのは「カテゴリD（slug等）」「カテゴリE（要確認で据え置いた識別子）」だけ**。それ以外が残っていれば対応漏れ。
- 設定ファイルがJSONなら構文崩れがないか確認（`app.json` がパースできるか）。
- `git diff` で変更点を確認する。

---

## 5. Git：コミット・プッシュ・PR作成

```bash
git add -A
git commit -m "chore: パッケージ名をcom.rengemaru.utachoへ変更し旧アプリ名Mykaraを歌帳へ統一"
git push -u origin chore/rename-to-utacho
```

- `gh` コマンドが使えるなら PR を作成する（使えなければブランチ名を報告し、オーナーがPRを開く）：
```bash
gh pr create --base main --head chore/rename-to-utacho \
  --title "パッケージ名変更＋旧アプリ名Mykaraの一掃" \
  --body "app.jsonのandroid.packageをcom.rengemaru.utachoへ変更。表示名Mykara/MyKaraを歌帳へ統一。slug/projectIdは据え置き。要確認項目は本文末尾に記載。"
```
- **main へのマージはしない。** PRレビュー（オーナー確認）が最終ゲート。
- PR本文または報告に、**カテゴリB（bundleId未設定）・E（要確認）で据え置いた項目の一覧**を必ず載せる。

---

## 6. 完了条件（チェックリスト）

- [ ] `chore/rename-to-utacho` ブランチを main から作成して作業した
- [ ] `expo.android.package` が `com.rengemaru.utacho`
- [ ] （iOS設定がある場合）`expo.ios.bundleIdentifier` も `com.rengemaru.utacho`、または未設定で報告済み
- [ ] 表示名「Mykara / MyKara」が「歌帳」に統一されている
- [ ] `slug` / `projectId` / version系は**未変更**
- [ ] `android/` がある場合は `applicationId` も一致
- [ ] grep残存が「据え置き対象のみ」になっている
- [ ] commit → push 済み、PR作成済み（または branch名を報告）
- [ ] **main は未変更**
- [ ] 据え置いた要確認項目をPR/報告に明記済み

---

## 7. このあとの流れ（参考・本タスク範囲外）

1. `google-services-key.json` を **新パッケージ名 `com.rengemaru.utacho`** で取得・配置
2. Google Play Console でアプリ新規作成（パッケージ名 `com.rengemaru.utacho`）
3. アイコン・フィーチャーグラフィックが揃ったら EAS Build（AAB）
4. EAS Submit（内部テスト）→ 動作確認
