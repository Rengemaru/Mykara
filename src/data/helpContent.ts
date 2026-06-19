export type HelpLink = {
  label: string;
  url: string;
};

export type HelpEntry = {
  id: string;
  heading: string;
  body: string[];
  links?: HelpLink[];
  showAppVersion?: boolean;
  needsReview?: boolean;
};

export type HelpSection = {
  id: string;
  title: string;
  icon?: string;
  entries: HelpEntry[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'はじめての方へ',
    icon: 'rocket',
    entries: [
      {
        id: 'quick-start',
        heading: '3ステップで使い始める',
        body: [
          '① 持ち歌を登録：曲の追加ボタンから曲名とアーティスト名を入力します。',
          '② 点数を記録：歌った曲を選び、キーパッドで点数を入力します。',
          '③ サマリーを見る：同じ曲の点数が自動でグラフになり、上達度が見えます。',
        ],
        needsReview: true,
      },
    ],
  },
  {
    id: 'features',
    title: '機能ガイド',
    icon: 'book-open',
    entries: [
      {
        id: 'add-song',
        heading: '曲を登録・編集・削除する',
        body: [
          '曲名・アーティスト名に加えて、キー（音程）やメモを記録できます。',
          '登録済みの曲は、あとから編集・削除できます。',
        ],
        needsReview: true,
      },
      {
        id: 'itunes-complete',
        heading: '曲名・アーティストを自動で補完する',
        body: [
          '曲名を入力すると、候補が表示されます。候補を選ぶとアーティスト名やアルバムのアートワークも一緒に取り込めます。',
          'この機能はインターネット接続が必要です（Apple の iTunes 検索を利用します）。',
        ],
        needsReview: true,
      },
      {
        id: 'tabs',
        heading: 'タブ（カテゴリ）で分類する',
        body: [
          'タブは自由に名前を付けて作れます。例：「十八番」「練習中」「アニソン」など。',
          '1つの曲を複数のタブに入れることもできます。用途に合わせて自由に整理できます。',
        ],
      },
      {
        id: 'record-score',
        heading: '点数を記録する',
        body: [
          'テンキーで点数を入力すると、履歴として残ります。',
          '同じ曲に何度でも記録でき、すべて推移グラフに反映されます。',
        ],
        needsReview: true,
      },
      {
        id: 'graph',
        heading: '点数の推移をグラフで見る',
        body: [
          '同じ曲の点数記録から折れ線グラフとして可視化されます。',
          '記録が増えるほど、上達の傾向がわかりやすくなります。',
        ],
        needsReview: true,
      },
      {
        id: 'machine-switch',
        heading: 'DAM / JOYSOUND を切り替える',
        body: [
          '機種ごとに点数を分けて管理できます（2系統）。採点の傾向が機種で違っても混ざりません。',
          '毎回起動時に選んだ機種が既定になります。あとから切り替えることもできます。',
        ],
        needsReview: true,
      },
      {
        id: 'backup',
        heading: 'バックアップ（書き出し・復元）',
        body: [
          '全データをファイル（JSON）として書き出します。機種変更やアプリの再インストール前に書き出しておくと安心です。',
          '書き出したファイルから復元すると、別の端末にもデータを引き継げます。',
        ],
        needsReview: true,
      },
    ],
  },
  {
    id: 'faq',
    title: 'よくある質問（FAQ）',
    icon: 'help-circle',
    entries: [
      {
        id: 'faq-storage',
        heading: 'データはどこに保存されますか？',
        body: [
          'すべて端末内に保存されます。あなたの曲や点数がサーバーへ送られることはありません。',
          '曲名の自動補完を使うときだけ、入力した検索文字が Apple の iTunes 検索に送られます。',
        ],
        needsReview: true,
      },
      {
        id: 'faq-transfer',
        heading: '機種変更してもデータは引き継げますか？',
        body: [
          '引き継げます。旧端末でバックアップを書き出し、新端末で「復元」を行ってください。',
        ],
      },
      {
        id: 'faq-machine-mix',
        heading: 'DAM と JOYSOUND の点数は混ざりますか？',
        body: ['混ざりません。機種ごとに分けて管理されます。'],
      },
      {
        id: 'faq-offline',
        heading: 'インターネットがなくても使えますか？',
        body: [
          '点数の記録や閲覧はオフラインでも使えます。曲名の自動補完だけインターネットが必要です。',
        ],
      },
      {
        id: 'faq-multi-tab',
        heading: '1曲を複数のタブに入れることはできますか？',
        body: ['できます。同じ曲を「十八番」と「アニソン」の両方に入れるといった使い方が可能です。'],
      },
      {
        id: 'faq-price',
        heading: '料金はかかりますか？',
        body: ['無料でご利用いただけます。'],
        needsReview: true,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: '困ったとき',
    icon: 'life-buoy',
    entries: [
      {
        id: 'ts-no-graph',
        heading: 'グラフが表示されない',
        body: [
          '点数の記録が1件だけだと、推移の線が描けません。2回以上記録するとグラフが表示されます。',
        ],
        needsReview: true,
      },
      {
        id: 'ts-no-suggest',
        heading: '曲名の補完候補が出ない',
        body: [
          'インターネット接続を確認してください。候補が出ないときは、手入力のままでも登録できます。',
        ],
      },
      {
        id: 'ts-data-lost',
        heading: 'データが消えた／前に戻したい',
        body: [
          '以前に書き出したバックアップがあれば、「復元」で前に戻せます。',
          'バックアップがない場合は復元できません。こまめな書き出しをおすすめします。',
        ],
        needsReview: true,
      },
      {
        id: 'ts-app-glitch',
        heading: 'アプリの動作がおかしい',
        body: [
          'まずアプリを一度終了して、再度起動してみてください。',
          'それでも改善しない場合は、下の「お問い合わせ」からご連絡ください。',
        ],
      },
    ],
  },
  {
    id: 'about',
    title: 'お問い合わせ・アプリ情報',
    icon: 'info',
    entries: [
      {
        id: 'contact',
        heading: 'お問い合わせ',
        body: ['ご意見・ご要望・不具合の報告はこちらからお願いします。'],
        links: [
          {
            label: 'メールで問い合わせる',
            // ⚠️ 公開前に実際のサポート用メールアドレスへ差し替え
            url: 'mailto:REPLACE_WITH_SUPPORT_EMAIL@example.com',
          },
        ],
        needsReview: true,
      },
      {
        id: 'privacy',
        heading: 'プライバシーポリシー',
        body: ['本アプリの個人情報の取り扱いについては、こちらをご確認ください。'],
        links: [
          {
            label: 'プライバシーポリシーを開く',
            // ⚠️ 公開済みのプライバシーポリシーURLへ差し替え
            url: 'https://REPLACE_WITH_PRIVACY_POLICY_URL',
          },
        ],
        needsReview: true,
      },
      {
        id: 'version',
        heading: 'バージョン情報',
        body: ['ご利用中のアプリのバージョンです。'],
        showAppVersion: true,
      },
    ],
  },
];
