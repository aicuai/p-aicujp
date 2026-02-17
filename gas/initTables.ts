/**
 * AICU MailNews - Table Initialization
 * Version: 1.3.0
 * スプレッドシートの初期テーブル設計とダミーデータ
 */

// =====================================================
// シート名定義
// =====================================================
const SHEET_NAMES = {
  CONTACTS: 'Contacts',
  EMAIL_LOGS: 'EmailLogs',
  LINK_CLICKS: 'LinkClicks',
  CAMPAIGNS: 'Campaigns',
  SETTINGS: 'Settings',
  QUOTA_STATS: 'QuotaStats',
  TABLES: '_Tables',
} as const;

// =====================================================
// スキーマ定義
// =====================================================

// Contacts: 顧客マスタ（Hubspotからインポート + 拡張）
const CONTACTS_HEADERS = [
  'id',                    // UUID
  'email',                 // メールアドレス（ユニーク）
  'last_name',             // 姓
  'first_name',            // 名
  'company',               // 会社名
  'phone',                 // 電話番号
  'country_region',        // 国/地域
  'tags',                  // タグ（カンマ区切り）
  'subscription_status',   // subscribed | unsubscribed | bounced
  'subscription_token',    // 配信停止用トークン
  'source',                // hubspot | manual | website
  'contact_owner',         // 担当者
  'hubspot_id',            // HubspotのオリジナルID
  'created_at',            // 作成日
  'updated_at',            // 更新日
  'last_activity_date',    // 最終アクティビティ日
  'last_email_sent',       // 最終メール送信日
  'last_email_opened',     // 最終メール開封日
  'last_link_clicked',     // 最終リンククリック日
  'total_emails_sent',     // 送信メール数
  'total_emails_opened',   // 開封数
  'total_links_clicked',   // クリック数
  'notes',                 // メモ
];

// EmailLogs: 配信ログ
const EMAIL_LOGS_HEADERS = [
  'id',                    // UUID
  'campaign_id',           // キャンペーンID
  'contact_id',            // ContactのID
  'email',                 // 送信先メール
  'status',                // queued | sent | delivered | opened | bounced | failed
  'sent_at',               // 送信日時
  'delivered_at',          // 配信日時
  'opened_at',             // 開封日時
  'bounce_reason',         // バウンス理由
  'error_message',         // エラーメッセージ
];

// LinkClicks: リンククリック
const LINK_CLICKS_HEADERS = [
  'id',                    // UUID
  'contact_id',            // ContactのID
  'email',                 // メールアドレス
  'campaign_id',           // キャンペーンID
  'original_url',          // 元のURL
  'clicked_at',            // クリック日時
  'user_agent',            // ユーザーエージェント
  'ip_address',            // IPアドレス（ハッシュ化推奨）
];

// Campaigns: キャンペーン（配信単位）
const CAMPAIGNS_HEADERS = [
  'id',                    // UUID
  'name',                  // キャンペーン名
  'subject',               // メール件名
  'content_markdown',      // Markdown本文
  'content_html',          // HTML本文
  'status',                // draft | scheduled | sending | sent
  'scheduled_at',          // 配信予定日時
  'sent_at',               // 配信完了日時
  'total_recipients',      // 送信対象数
  'total_sent',            // 送信数
  'total_opened',          // 開封数
  'total_clicked',         // クリック数
  'total_bounced',         // バウンス数
  'created_at',            // 作成日
  'updated_at',            // 更新日
];

// Settings: 設定
const SETTINGS_HEADERS = [
  'key',                   // 設定キー
  'value',                 // 設定値
  'description',           // 説明
  'updated_at',            // 更新日
];

// QuotaStats: 日次統計・クォータ管理
const QUOTA_STATS_HEADERS = [
  'date',                  // 日付（YYYY-MM-DD）
  'emails_sent',           // 送信数
  'emails_opened',         // 開封数
  'emails_failed',         // 失敗数
  'links_clicked',         // クリック数
  'unsubscribes',          // 解除数
  'new_subscribers',       // 新規登録数
  'urlfetch_used',         // UrlFetch使用数（推定）
  'quota_email_limit',     // メール送信上限（1500）
  'quota_email_remaining', // メール送信残量
  'api_health',            // API ステータス（ok | warning | error）
  'notes',                 // 備考
  'created_at',            // 作成日時
];

// _Tables: テーブル定義ドキュメント（日本語解説）
const TABLES_HEADERS = [
  'sheet_name',            // シート名
  'description_ja',        // 説明（日本語）
  'api_actions',           // 利用可能なAPIアクション
  'api_url_example',       // API URL 例
  'notes',                 // 備考
  'updated_at',            // 更新日
];

// =====================================================
// 初期化関数
// =====================================================

/**
 * 全テーブルを初期化（既存データは削除されるので注意）
 */
function initTables(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 各シートを作成または取得してヘッダー設定
  initSheet(ss, SHEET_NAMES.CONTACTS, CONTACTS_HEADERS);
  initSheet(ss, SHEET_NAMES.EMAIL_LOGS, EMAIL_LOGS_HEADERS);
  initSheet(ss, SHEET_NAMES.LINK_CLICKS, LINK_CLICKS_HEADERS);
  initSheet(ss, SHEET_NAMES.CAMPAIGNS, CAMPAIGNS_HEADERS);
  initSheet(ss, SHEET_NAMES.SETTINGS, SETTINGS_HEADERS);
  initSheet(ss, SHEET_NAMES.QUOTA_STATS, QUOTA_STATS_HEADERS);
  initSheet(ss, SHEET_NAMES.TABLES, TABLES_HEADERS);

  // ダミーデータ投入
  insertDummyContacts(ss);
  insertDummyCampaigns(ss);
  insertDummySettings(ss);
  insertTablesDocumentation(ss);

  SpreadsheetApp.getUi().alert('テーブル初期化完了！');
}

/**
 * QuotaStats シートのみを初期化（既存テーブルに追加する場合）
 */
function initQuotaStatsTable(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheet(ss, SHEET_NAMES.QUOTA_STATS, QUOTA_STATS_HEADERS);
  SpreadsheetApp.getUi().alert('QuotaStats テーブル作成完了！');
}

/**
 * _Tables シートのみを初期化
 */
function initTablesDocumentation(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheet(ss, SHEET_NAMES.TABLES, TABLES_HEADERS);
  insertTablesDocumentation(ss);
  SpreadsheetApp.getUi().alert('_Tables ドキュメント作成完了！');
}

/**
 * シートを初期化（あればバックアップして新規作成）
 */
function initSheet(ss: GoogleAppsScript.Spreadsheet.Spreadsheet, sheetName: string, headers: string[]): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
    const backupName = `${sheetName}_old_${timestamp}`;
    sheet.setName(backupName);
    console.log(`Backed up ${sheetName} to ${backupName}`);
  }

  const newSheet = ss.insertSheet(sheetName);

  // ヘッダー設定
  newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  newSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');

  // 列幅調整
  newSheet.setFrozenRows(1);

  return newSheet;
}

/**
 * UUID生成
 */
function generateUUID(): string {
  return Utilities.getUuid();
}

/**
 * 配信停止トークン生成
 */
function generateSubscriptionToken(): string {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 24);
}

// =====================================================
// ダミーデータ投入
// =====================================================

function insertDummyContacts(ss: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);
  if (!sheet) return;

  const now = new Date();

  const dummyData = [
    [
      generateUUID(),
      'akihiko.shirai@gmail.com',
      '白井',
      '暁彦',
      '個人',
      '050-3591-3201',
      'Japan',
      'TEST',
      'subscribed',
      generateSubscriptionToken(),
      'InitTables',
      'aki',
      'hs_12345',
      now,
      now,
      now,
      '',
      '',
      '',
      0,
      0,
      0,
      'テストユーザ',
    ],
    [
      generateUUID(),
      'shirai@mail.com',
      'SHIRAI',
      'Akihiko',
      'Personal',
      '',
      'Japan',
      'TEST',
      'subscribed',
      generateSubscriptionToken(),
      'InitTables',
      'aki',
      'hs_12346',
      now,
      now,
      now,
      '',
      '',
      '',
      0,
      0,
      0,
      '',
    ],
  ];

  if (dummyData.length > 0) {
    sheet.getRange(2, 1, dummyData.length, dummyData[0].length).setValues(dummyData);
  }
}

function insertDummyCampaigns(ss: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
  const sheet = ss.getSheetByName(SHEET_NAMES.CAMPAIGNS);
  if (!sheet) return;

  const now = new Date().toISOString();

  const dummyData = [
    [
      generateUUID(),
      'AICU Weekly #001',
      '【AICU Weekly】今週のAI最新情報',
      '# 週刊AICU #001\n\n今週のトピックス:\n\n- ComfyUI新機能解説\n- Stable Diffusion 3.5 レビュー\n- 画像生成AIの最新トレンド\n\n[続きを読む](https://note.com/aicu)',
      '',
      'draft',
      '',
      '',
      0,
      0,
      0,
      0,
      0,
      now,
      now,
    ],
    [
      generateUUID(),
      'AICU Weekly #000 (テスト)',
      '【テスト】AICU MailNews システムテスト',
      '# システムテスト\n\nこれはテスト配信です。\n\n[AICUサイト](https://aicu.jp)',
      '',
      'sent',
      now,
      now,
      3,
      3,
      1,
      0,
      0,
      now,
      now,
    ],
  ];

  if (dummyData.length > 0) {
    sheet.getRange(2, 1, dummyData.length, dummyData[0].length).setValues(dummyData);
  }
}

function insertDummySettings(ss: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return;

  const now = new Date().toISOString();

  const dummyData = [
    ['sender_email', 'info@aicu.jp', '送信元メールアドレス（Phase1）', now],
    ['sender_name', 'AICU Japan', '送信者名', now],
    ['reply_to', 'aki@aicu.ai', '返信先メールアドレス', now],
    ['batch_size', '100', '1バッチあたりの送信数', now],
    ['batch_interval_minutes', '5', 'バッチ間隔（分）', now],
    ['base_url', 'https://p.aicu.jp', 'WebアプリのベースURL', now],
    ['tracking_enabled', 'true', 'リンクトラッキング有効', now],
    ['unsubscribe_url', 'https://p.aicu.jp/mailnews', '配信停止ページURL', now],
    ['current_phase', '1', '現在のフェーズ（1=aicu.ai, 2=移行中, 3=aicu.jp）', now],
    ['resend_api_key', '', 'Resend APIキー（Phase3で使用）', now],
    ['report_email', '', 'レポート送付先メールアドレス（空白時は送付しない）', now],
    ['slack_webhook_url', '', 'Slack Webhook URL（空白時は送付しない）', now],
  ];

  if (dummyData.length > 0) {
    sheet.getRange(2, 1, dummyData.length, dummyData[0].length).setValues(dummyData);
  }
}

/**
 * _Tables シートにテーブル定義ドキュメントを投入
 */
function insertTablesDocumentation(ss: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
  const sheet = ss.getSheetByName(SHEET_NAMES.TABLES);
  if (!sheet) return;

  const now = new Date().toISOString();
  const baseUrl = '=HYPERLINK("https://script.google.com/macros/s/AKfycby.../exec","GAS WebApp")';

  // テーブルドキュメント
  const tablesData = [
    [
      'Contacts',
      '顧客マスタ。メールアドレス、名前、購読状態を管理。HubSpotからインポート可能。',
      'getContact, getSubscription, updateContact, subscribe, unsubscribe, resubscribe',
      '?action=getContact&email=xxx',
      '購読トークンで認証',
      now,
    ],
    [
      'EmailLogs',
      '配信ログ。各メール送信の日時、ステータス、開封状況を記録。',
      'listEmailLogs',
      '?action=listEmailLogs&campaign_id=xxx',
      'キャンペーンIDでフィルタ可能',
      now,
    ],
    [
      'LinkClicks',
      'リンククリック追跡。メール内リンクのクリック日時、URL、ユーザー情報を記録。',
      'trackClick',
      '?action=trackClick&url=xxx&email=yyy',
      'リダイレクト型トラッキング',
      now,
    ],
    [
      'Campaigns',
      'キャンペーン（配信単位）。件名、本文、送信ステータス、統計を管理。',
      'listCampaigns, sendCampaign, getStats',
      '?action=listCampaigns',
      'status: draft→scheduled→sending→sent',
      now,
    ],
    [
      'Settings',
      'システム設定。送信元メール、Slack Webhook URL、API キーなどを管理。',
      'getSetting, setSetting',
      '?action=getSetting&key=xxx',
      'key-value 形式',
      now,
    ],
    [
      'QuotaStats',
      '日次統計・クォータ管理。送信数、開封数、クリック数、GASクォータ残量を日次で記録。',
      'getAdminStats, listQuotaStats, recordDailyStats',
      '?action=getAdminStats&key=ADMIN_KEY',
      '毎日自動集計（トリガー）',
      now,
    ],
    [
      '_Tables',
      'テーブル定義ドキュメント（このシート）。各シートの説明とAPI仕様を日本語で記載。',
      '-',
      '-',
      'システムが自動生成',
      now,
    ],
  ];

  if (tablesData.length > 0) {
    sheet.getRange(2, 1, tablesData.length, tablesData[0].length).setValues(tablesData);
  }

  // 列幅調整
  sheet.setColumnWidth(1, 120);  // sheet_name
  sheet.setColumnWidth(2, 400);  // description_ja
  sheet.setColumnWidth(3, 350);  // api_actions
  sheet.setColumnWidth(4, 250);  // api_url_example
  sheet.setColumnWidth(5, 200);  // notes
}

// =====================================================
// Hubspotインポート用
// =====================================================

/**
 * HubspotエクスポートCSVをContactsにインポート
 * CSVは別シート「HubspotImport」に貼り付けてから実行
 */
function importFromHubspot(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const importSheet = ss.getSheetByName('HubspotImport');
  const contactsSheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);

  if (!importSheet) {
    SpreadsheetApp.getUi().alert('「HubspotImport」シートを作成し、CSVデータを貼り付けてください');
    return;
  }

  if (!contactsSheet) {
    SpreadsheetApp.getUi().alert('先にinitTables()を実行してください');
    return;
  }

  const data = importSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('インポートデータがありません');
    return;
  }

  const headers = data[0] as string[];
  const rows = data.slice(1);

  // Hubspotカラムマッピング定義
  const HEADER_MAP: { [key: string]: string[] } = {
    email: ['email', 'Eメール', 'e-mail'],
    first_name: ['first_name', '名', 'first name'],
    last_name: ['last_name', '姓', 'last name'],
    company: ['company', '会社名', 'associated_company', 'ウェブサイトURL', 'website_url'],
    phone: ['phone', '電話番号', 'phone_number', '携帯電話番号'],
    owner: ['contact_owner', 'コンタクト担当者', 'owner'],
    last_activity: ['last_activity_date', '前回のアクティビティー日'],
    created_at: ['created_at', '作成日', '登録日時'],
    hubspot_id: ['hubspot_id', 'レコードID - Contact', 'record_id'],
    country: ['country/region', '国／地域', 'country', 'IPの国コード', 'ip_country_code'],
    tags: ['tags', '興味ある会員プラン', '興味', 'industry', '業種']
  };

  // カラムインデックス検索ヘルパー
  const findColIndex = (targetKeys: string[]): number => {
    for (const key of targetKeys) {
      const idx = headers.findIndex(h =>
        h.trim().toLowerCase() === key.toLowerCase() ||
        h.trim().toLowerCase().replace(/\s+/g, '_') === key.toLowerCase()
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const emailIdx = findColIndex(HEADER_MAP.email);
  const firstNameIdx = findColIndex(HEADER_MAP.first_name);
  const lastNameIdx = findColIndex(HEADER_MAP.last_name);
  const companyIdx = findColIndex(HEADER_MAP.company);
  const phoneIdx = findColIndex(HEADER_MAP.phone);
  const ownerIdx = findColIndex(HEADER_MAP.owner);
  const lastActivityIdx = findColIndex(HEADER_MAP.last_activity);
  const hubspotIdIdx = findColIndex(HEADER_MAP.hubspot_id);
  const countryIdx = findColIndex(HEADER_MAP.country);
  const tagsIdx = findColIndex(HEADER_MAP.tags);

  if (emailIdx === -1) {
    const headerDump = headers.map((h, i) => `[${i}]${h}`).join(', ');
    SpreadsheetApp.getUi().alert(`Emailカラムが見つかりません。\n検出されたヘッダー: ${headerDump}`);
    return;
  }

  const now = new Date();
  let importedCount = 0;
  let skippedCount = 0;

  // 既存メールアドレス取得
  const existingEmails = new Set<string>();
  const existingData = contactsSheet.getDataRange().getValues();
  const existingHeaders = existingData[0] as string[];
  const emailColIdxInternal = existingHeaders.indexOf('email');

  // initTables前の場合は中断
  if (emailColIdxInternal === -1) {
    SpreadsheetApp.getUi().alert('Contactsシートのヘッダーが不正です。initTablesを実行してください。');
    return;
  }

  existingData.slice(1).forEach(row => {
    if (row[emailColIdxInternal]) {
      existingEmails.add(row[emailColIdxInternal].toString().toLowerCase());
    }
  });

  // インポートデータ構築用インターフェース
  interface ImportedContact {
    [key: string]: any;
  }

  const contactsBuffer: ImportedContact[] = [];

  rows.forEach((row, idx) => {
    const email = row[emailIdx]?.toString().trim().toLowerCase();

    // メールがない、または重複、または無効なメールアドレスを含んでいる場合はスキップ
    if (!email || existingEmails.has(email) || email.includes('invalid') || !email.includes('@')) {
      skippedCount++;
      return;
    }

    // 詳細な値の取得と整形
    const getVal = (idx: number) => idx !== -1 ? row[idx]?.toString().trim() || '' : '';

    // 姓名の取得とフォールバック処理
    let firstName = getVal(firstNameIdx);
    let lastName = getVal(lastNameIdx);

    // 両方空の場合、メールアドレスの@より前を姓として使用
    if (!firstName && !lastName) {
      const emailPrefix = email.split('@')[0];
      lastName = emailPrefix;
    }

    // CreatedAtの処理 (Hubspotの作成日 or 現在日時)
    const createdAtRaw = getVal(findColIndex(HEADER_MAP.created_at));
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : now;

    // タグの結合
    let tags = getVal(tagsIdx);

    // データオブジェクト構築 (CONTACTS_HEADERSのキーに対応させる)
    const contactObj: ImportedContact = {
      id: generateUUID(),
      email: email,
      last_name: lastName,
      first_name: firstName,
      company: getVal(companyIdx),
      phone: getVal(phoneIdx),
      country_region: getVal(countryIdx),
      tags: tags,
      subscription_status: 'subscribed',
      subscription_token: generateSubscriptionToken(),
      source: 'hubspot',
      contact_owner: getVal(ownerIdx),
      hubspot_id: getVal(hubspotIdIdx) || `hs_import_${idx}`,
      created_at: createdAt,
      updated_at: now,
      last_activity_date: getVal(lastActivityIdx),
      last_email_sent: '',
      last_email_opened: '',
      last_link_clicked: '',
      total_emails_sent: 0,
      total_emails_opened: 0,
      total_links_clicked: 0,
      notes: 'Hubspotからインポート'
    };

    contactsBuffer.push(contactObj);
    existingEmails.add(email);
    importedCount++;
  });

  // created_at (降順) でソート
  contactsBuffer.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // 二次元配列に変換 (CONTACTS_HEADERSの順序に従う)
  // これにより、Contactsシートのカラム順序が変わっても、ヘッダー名さえ合っていれば追従可能
  const finalHeaders = contactsSheet.getDataRange().getValues()[0] as string[];

  const newContacts = contactsBuffer.map(c => {
    return finalHeaders.map(header => {
      // headerに対応する値があれば返す、なければ空文字
      return c[header] !== undefined ? c[header] : '';
    });
  });

  if (newContacts.length > 0) {
    const lastRow = contactsSheet.getLastRow();
    contactsSheet.getRange(lastRow + 1, 1, newContacts.length, newContacts[0].length).setValues(newContacts);
  }

  SpreadsheetApp.getUi().alert(`インポート完了\n- インポート: ${importedCount}件\n- スキップ（重複等）: ${skippedCount}件`);
}

// =====================================================
// ユーティリティ
// =====================================================

/**
 * 設定値を取得
 */
function getSetting(key: string): string {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return '';

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1]?.toString() || '';
    }
  }
  return '';
}

/**
 * 設定値を更新
 */
function setSetting(key: string, value: string): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 4).setValue(now);
      return;
    }
  }

  // 新規追加
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, 4).setValues([[key, value, '', now]]);
}

/**
 * 購読中のコンタクト一覧を取得
 */
function getSubscribedContacts(): any[][] {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTACTS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const statusIdx = headers.indexOf('subscription_status');

  return data.slice(1).filter(row => row[statusIdx] === 'subscribed');
}
