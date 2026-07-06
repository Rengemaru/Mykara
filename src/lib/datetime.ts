/**
 * 記録日時の文字列を表示用に整形する。
 * 「2026-06-24T21:30」→「2026/06/24 21:30」
 * 日付のみの旧データ「2026-06-24」→「2026/06/24」
 */
export function formatDateTime(s: string): string {
  const [datePart, timePart] = s.split('T');
  const d = datePart.replace(/-/g, '/');
  return timePart ? `${d} ${timePart}` : d;
}

/**
 * 「2026-06-24T21:30」→「6/24 21:30」のような短縮表示。
 * 日付のみの旧データは「6/24」。グラフの軸ラベルなど省スペース用。
 */
export function formatShortDateTime(s: string): string {
  const [datePart, timePart] = s.split('T');
  const [, month, day] = datePart.split('-');
  const md = `${Number(month)}/${Number(day)}`;
  return timePart ? `${md} ${timePart}` : md;
}

/** 日付部分（YYYY-MM-DD）だけを取り出す。日時・日付どちらの形式でも動く */
export function datePartOf(s: string): string {
  return s.split('T')[0];
}
