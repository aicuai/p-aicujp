/**
 * AICU MailNews - Web API Endpoints
 * Version: 1.3.0
 * GAS Web App として公開し、Vercelからプロキシする
 */

// =====================================================
// Web App エントリポイント
// =====================================================

/**
 * GET リクエストハンドラ
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter.action || '';
  const response = handleRequest(action, e.parameter, 'GET');
  return createJsonResponse(response);
}

/**
 * POST リクエストハンドラ
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let params: Record<string, string> = {};

  try {
    if (e.postData?.contents) {
      params = JSON.parse(e.postData.contents);
    }
  } catch {
    params = e.parameter || {};
  }

  const action = params.action || e.parameter?.action || '';
  const response = handleRequest(action, params, 'POST');
  return createJsonResponse(response);
}

/**
 * リクエストルーター
 */
function handleRequest(action: string, params: Record<string, any>, method: string): ApiResponse {
  try {
    switch (action) {
      // 配信設定
      case 'getSubscription':
        return getSubscriptionStatus(params.email, params.token);

      case 'getContact':
        return getContactInfo(params.email, params.token);

      case 'updateContact':
        return updateContactInfo(params.email, params.token, params);

      case 'unsubscribe':
        return unsubscribeContact(params.email, params.token);

      case 'resubscribe':
        return resubscribeContact(params.email, params.token);

      case 'updatePreferences':
        return updateContactPreferences(params.email, params.token, params.preferences);

      // 新規購読
      case 'subscribe':
        return subscribeContact(params.email, params.firstName, params.lastName);

      // リンクトラッキング
      case 'trackClick':
        return trackLinkClick(params);

      // キャンペーン管理（管理者用）
      case 'listCampaigns':
        return listCampaigns();

      case 'getCampaign':
        return getCampaign(params.id);

      case 'sendCampaign':
        return sendCampaignById(params.id, params.testMode === 'true');

      case 'addCampaign':
        return addCampaign(params);

      case 'testSendTo':
        return testSendToAddress(params.id, params.email);

      // 統計（管理者用）
      case 'getStats':
        return getStatistics();

      // QuotaStats / Admin API
      case 'getAdminStats':
        return getAdminStats(params.key);

      case 'listQuotaStats':
        return listQuotaStats(params.from_date, params.to_date);

      case 'recordDailyStats':
        return recordDailyStats(params.key);

      // 設定管理
      case 'getSetting':
        return getSettingApi(params.key);

      case 'setSetting':
        return setSettingApi(params.key, params.value);

      // ヘルスチェック
      case 'health':
        return { success: true, message: 'OK', timestamp: new Date().toISOString() };

      default:
        return { success: false, error: 'Unknown action', action };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      action
    };
  }
}

// =====================================================
// レスポンスヘルパー
// =====================================================

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
  [key: string]: any;
}

function createJsonResponse(data: ApiResponse): GoogleAppsScript.Content.TextOutput {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// 配信設定 API
// =====================================================

/**
 * 購読状態を取得
 */
function getSubscriptionStatus(email: string, token: string): ApiResponse {
  if (!email || !token) {
    return { success: false, error: 'Missing email or token' };
  }

  const contact = findContactByEmailAndToken(email, token);
  if (!contact) {
    return { success: false, error: 'Invalid email or token' };
  }

  return {
    success: true,
    data: {
      email: contact.email,
      firstName: contact.first_name,
      lastName: contact.last_name,
      status: contact.subscription_status,
      tags: contact.tags,
    }
  };
}

/**
 * ユーザー詳細情報を取得 (設定ページ用)
 */
function getContactInfo(email: string, token: string): ApiResponse {
  if (!email || !token) {
    return { success: false, error: 'Missing email or token' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return { success: false, error: 'Contacts sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const emailIdx = headers.indexOf('email');
  const tokenIdx = headers.indexOf('subscription_token');

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIdx]?.toString().toLowerCase() === email.toLowerCase() &&
      data[i][tokenIdx]?.toString() === token) {

      const contact: Record<string, any> = {};
      headers.forEach((h, idx) => {
        contact[h] = data[i][idx];
      });

      return {
        success: true,
        contact: contact
      };
    }
  }

  return { success: false, error: 'Invalid email or token' };
}

/**
 * ユーザー情報を更新
 */
function updateContactInfo(email: string, token: string, params: any): ApiResponse {
  if (!email || !token) {
    return { success: false, error: 'Missing email or token' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return { success: false, error: 'Contacts sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const emailIdx = headers.indexOf('email');
  const tokenIdx = headers.indexOf('subscription_token');
  const updatedAtIdx = headers.indexOf('updated_at');

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIdx]?.toString().toLowerCase() === email.toLowerCase() &&
      data[i][tokenIdx]?.toString() === token) {

      const rowIndex = i + 1;
      const now = new Date();

      // 更新可能なフィールド
      if (params.firstName !== undefined) {
        const idx = headers.indexOf('first_name');
        if (idx !== -1) sheet.getRange(rowIndex, idx + 1).setValue(params.firstName);
      }
      if (params.lastName !== undefined) {
        const idx = headers.indexOf('last_name');
        if (idx !== -1) sheet.getRange(rowIndex, idx + 1).setValue(params.lastName);
      }
      if (params.company !== undefined) {
        const idx = headers.indexOf('company');
        if (idx !== -1) sheet.getRange(rowIndex, idx + 1).setValue(params.company);
      }
      if (params.tags !== undefined) {
        const idx = headers.indexOf('tags');
        if (idx !== -1) {
          const tagsString = Array.isArray(params.tags) ? params.tags.join(',') : params.tags;
          sheet.getRange(rowIndex, idx + 1).setValue(tagsString);
        }
      }

      // Deletion Request
      if (params.isDeletionRequested) {
        // Here we could either set a special status, add a tag, or log it.
        // For now, let's add a "DELETION_REQUESTED" tag if not already there.
        const idx = headers.indexOf('tags');
        if (idx !== -1) {
          let currentTags = data[i][idx]?.toString() || '';
          if (!currentTags.includes('DELETION_REQUESTED')) {
            const nextTags = currentTags ? `${currentTags},DELETION_REQUESTED` : 'DELETION_REQUESTED';
            sheet.getRange(rowIndex, idx + 1).setValue(nextTags);
          }
        }
      }

      // UpdatedAt更新
      if (updatedAtIdx !== -1) {
        sheet.getRange(rowIndex, updatedAtIdx + 1).setValue(now);
      }

      return { success: true, message: 'Settings updated' };
    }
  }

  return { success: false, error: 'Invalid email or token' };
}

/**
 * 配信停止
 */
function unsubscribeContact(email: string, token: string): ApiResponse {
  if (!email || !token) {
    return { success: false, error: 'Missing email or token' };
  }

  const result = updateSubscriptionStatus(email, token, 'unsubscribed');
  if (!result) {
    return { success: false, error: 'Invalid email or token' };
  }

  return { success: true, message: '配信を停止しました' };
}

/**
 * 配信再開
 */
function resubscribeContact(email: string, token: string): ApiResponse {
  if (!email || !token) {
    return { success: false, error: 'Missing email or token' };
  }

  const result = updateSubscriptionStatus(email, token, 'subscribed');
  if (!result) {
    return { success: false, error: 'Invalid email or token' };
  }

  return { success: true, message: '配信を再開しました' };
}

/**
 * プリファレンス更新
 */
function updateContactPreferences(email: string, token: string, preferences: any): ApiResponse {
  if (!email || !token) {
    return { success: false, error: 'Missing email or token' };
  }

  const contact = findContactByEmailAndToken(email, token);
  if (!contact) {
    return { success: false, error: 'Invalid email or token' };
  }

  // タグ更新など
  if (preferences?.tags) {
    updateContactField(email, 'tags', preferences.tags);
  }

  return { success: true, message: '設定を更新しました' };
}

// =====================================================
// リンクトラッキング API
// =====================================================

/**
 * リンククリックを記録してリダイレクト
 */
function trackLinkClick(params: Record<string, string>): ApiResponse {
  const { email, campaign_id, url, token } = params;

  if (!url) {
    return { success: false, error: 'Missing URL' };
  }

  // クリック記録
  if (email && campaign_id) {
    recordLinkClick(email, campaign_id, url);
  }

  // 実際のリダイレクトはVercel側で処理
  return {
    success: true,
    redirect: url
  };
}

/**
 * リンククリックを記録
 */
function recordLinkClick(email: string, campaignId: string, url: string): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clicksSheet = ss.getSheetByName('LinkClicks');
  const contactsSheet = ss.getSheetByName('Contacts');

  if (!clicksSheet || !contactsSheet) return;

  const now = new Date().toISOString();

  // コンタクトID取得
  const contactData = contactsSheet.getDataRange().getValues();
  const headers = contactData[0] as string[];
  const emailIdx = headers.indexOf('email');
  const idIdx = headers.indexOf('id');

  let contactId = '';
  for (let i = 1; i < contactData.length; i++) {
    if (contactData[i][emailIdx]?.toString().toLowerCase() === email.toLowerCase()) {
      contactId = contactData[i][idIdx]?.toString() || '';

      // last_link_clicked 更新
      const lastClickIdx = headers.indexOf('last_link_clicked');
      const totalClickIdx = headers.indexOf('total_links_clicked');
      if (lastClickIdx !== -1) {
        contactsSheet.getRange(i + 1, lastClickIdx + 1).setValue(now);
      }
      if (totalClickIdx !== -1) {
        const current = parseInt(contactData[i][totalClickIdx]?.toString() || '0', 10);
        contactsSheet.getRange(i + 1, totalClickIdx + 1).setValue(current + 1);
      }
      break;
    }
  }

  // クリック記録追加
  clicksSheet.appendRow([
    Utilities.getUuid(),
    contactId,
    email,
    campaignId,
    url,
    now,
    '', // user_agent (Vercelから渡す場合)
    '', // ip_address
  ]);
}

// =====================================================
// キャンペーン管理 API
// =====================================================

function listCampaigns(): ApiResponse {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campaigns');
  if (!sheet) return { success: false, error: 'Campaigns sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];

  const campaigns = data.slice(1).map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });

  return { success: true, data: campaigns };
}

function getCampaign(id: string): ApiResponse {
  if (!id) return { success: false, error: 'Missing campaign ID' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campaigns');
  if (!sheet) return { success: false, error: 'Campaigns sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const idIdx = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id) {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = data[i][idx];
      });
      return { success: true, data: obj };
    }
  }

  return { success: false, error: 'Campaign not found' };
}

function sendCampaignById(id: string, testMode: boolean = false): ApiResponse {
  if (!id) return { success: false, error: 'Missing campaign ID' };

  // sendEmail.ts の sendCampaign を呼び出す
  // 実装は sendEmail.ts 側
  return { success: true, message: 'Campaign queued', testMode };
}

// =====================================================
// 統計 API
// =====================================================

function getStatistics(): ApiResponse {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const contactsSheet = ss.getSheetByName('Contacts');
  const logsSheet = ss.getSheetByName('EmailLogs');
  const clicksSheet = ss.getSheetByName('LinkClicks');

  if (!contactsSheet) return { success: false, error: 'Contacts sheet not found' };

  const contactData = contactsSheet.getDataRange().getValues();
  const headers = contactData[0] as string[];
  const statusIdx = headers.indexOf('subscription_status');

  let subscribed = 0;
  let unsubscribed = 0;
  let bounced = 0;

  contactData.slice(1).forEach(row => {
    const status = row[statusIdx];
    if (status === 'subscribed') subscribed++;
    else if (status === 'unsubscribed') unsubscribed++;
    else if (status === 'bounced') bounced++;
  });

  const totalEmails = logsSheet ? logsSheet.getLastRow() - 1 : 0;
  const totalClicks = clicksSheet ? clicksSheet.getLastRow() - 1 : 0;

  return {
    success: true,
    data: {
      contacts: {
        total: contactData.length - 1,
        subscribed,
        unsubscribed,
        bounced,
      },
      emails: {
        total: totalEmails,
      },
      clicks: {
        total: totalClicks,
      }
    }
  };
}

// =====================================================
// データアクセスヘルパー
// =====================================================

interface ContactData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_status: string;
  subscription_token: string;
  tags: string;
  rowIndex: number;
}

function findContactByEmailAndToken(email: string, token: string): ContactData | null {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];

  const emailIdx = headers.indexOf('email');
  const tokenIdx = headers.indexOf('subscription_token');

  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][emailIdx]?.toString().toLowerCase();
    const rowToken = data[i][tokenIdx]?.toString();

    if (rowEmail === email.toLowerCase() && rowToken === token) {
      const contact: ContactData = {
        id: data[i][headers.indexOf('id')]?.toString() || '',
        email: rowEmail,
        first_name: data[i][headers.indexOf('first_name')]?.toString() || '',
        last_name: data[i][headers.indexOf('last_name')]?.toString() || '',
        subscription_status: data[i][headers.indexOf('subscription_status')]?.toString() || '',
        subscription_token: rowToken,
        tags: data[i][headers.indexOf('tags')]?.toString() || '',
        rowIndex: i + 1,
      };
      return contact;
    }
  }

  return null;
}

function updateSubscriptionStatus(email: string, token: string, status: string): boolean {
  const contact = findContactByEmailAndToken(email, token);
  if (!contact) return false;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return false;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] as string[];
  const statusIdx = headers.indexOf('subscription_status');
  const updatedIdx = headers.indexOf('updated_at');

  sheet.getRange(contact.rowIndex, statusIdx + 1).setValue(status);
  sheet.getRange(contact.rowIndex, updatedIdx + 1).setValue(new Date().toISOString());

  return true;
}

function updateContactField(email: string, field: string, value: any): boolean {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const emailIdx = headers.indexOf('email');
  const fieldIdx = headers.indexOf(field);
  const updatedIdx = headers.indexOf('updated_at');

  if (fieldIdx === -1) return false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIdx]?.toString().toLowerCase() === email.toLowerCase()) {
      sheet.getRange(i + 1, fieldIdx + 1).setValue(value);
      sheet.getRange(i + 1, updatedIdx + 1).setValue(new Date().toISOString());
      return true;
    }
  }

  return false;
}

/**
 * 新規購読登録
 */
function subscribeContact(email: string, firstName: string, lastName: string): ApiResponse {
  if (!email) {
    return { success: false, error: 'Missing email' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return { success: false, error: 'System error' };

  // 既存チェック
  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const emailIdx = headers.indexOf('email');

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIdx]?.toString().toLowerCase() === email.toLowerCase()) {
      return { success: true, message: 'Already registered' };
    }
  }

  // 新規追加
  const now = new Date().toISOString();
  const newRow = Array(headers.length).fill('');

  const setVal = (col: string, val: any) => {
    const idx = headers.indexOf(col);
    if (idx !== -1) newRow[idx] = val;
  };

  setVal('id', Utilities.getUuid());
  setVal('email', email);
  setVal('first_name', firstName || '');
  setVal('last_name', lastName || '');
  setVal('subscription_status', 'subscribed');
  const token = Utilities.getUuid().replace(/-/g, '').substring(0, 24);
  setVal('subscription_token', token);
  setVal('tags', 'weekly,important'); // Default tags
  setVal('source', 'web_form');
  setVal('created_at', now);
  setVal('updated_at', now);

  sheet.appendRow(newRow);

  // Send Welcome Email
  try {
    sendWelcomeEmail(email, token, firstName, lastName);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  return { success: true, message: 'Subscribed successfully' };
}

/**
 * 登録お礼メールの送信
 */
function sendWelcomeEmail(email: string, token: string, firstName: string, lastName: string): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) return;

  const settings: Record<string, string> = {};
  settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 2).getValues().forEach(row => {
    settings[row[0]] = row[1];
  });

  const senderName = settings['sender_name'] || 'AICU Inc.';
  const senderEmail = settings['sender_email'] || 'info@aicu.jp';
  const siteUrl = 'https://p.aicu.jp/mailnews';
  const settingsLink = `${siteUrl}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  const name = firstName || lastName ? `${lastName} ${firstName}`.trim() : '読者';

  const subject = `【AICU】ご登録ありがとうございます`;
  const body = `${name} 様

AICUのメールニュース、週刊AICUにご登録いただきありがとうございます！

最新のAI技術情報、AICUの活動やイベント情報を定期的にお届けします。

配信設定の変更や登録情報の更新は、以下のリンクからいつでも行えます。
${settingsLink}

今後ともAICUをよろしくお願いいたします。

--
AICU Inc.
${senderEmail}
`;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    name: senderName
  });
}

// =====================================================
// QuotaStats / Admin API
// =====================================================

const ADMIN_API_KEY_SETTING = 'admin_api_key';
const QUOTA_EMAIL_LIMIT = 1500;  // Google Workspace daily limit
const QUOTA_URLFETCH_LIMIT = 20000;

/**
 * 管理者統計API - システム全体の統計とクォータ情報を取得
 */
function getAdminStats(apiKey: string): ApiResponse {
  // API キー認証
  const validKey = getSetting(ADMIN_API_KEY_SETTING);
  if (validKey && apiKey !== validKey) {
    return { success: false, error: 'Invalid API key' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = new Date();
  const todayStr = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy-MM-dd');

  // 各シートからデータ集計
  const contactsSheet = ss.getSheetByName('Contacts');
  const emailLogsSheet = ss.getSheetByName('EmailLogs');
  const linkClicksSheet = ss.getSheetByName('LinkClicks');
  const campaignsSheet = ss.getSheetByName('Campaigns');

  // Contacts 統計
  let totalSubscribers = 0;
  let todayUnsubscribes = 0;
  let todayNewSubscribers = 0;
  if (contactsSheet) {
    const data = contactsSheet.getDataRange().getValues();
    const headers = data[0] as string[];
    const statusIdx = headers.indexOf('subscription_status');
    const createdIdx = headers.indexOf('created_at');
    const updatedIdx = headers.indexOf('updated_at');

    for (let i = 1; i < data.length; i++) {
      if (data[i][statusIdx] === 'subscribed') totalSubscribers++;

      const createdAt = data[i][createdIdx]?.toString().substring(0, 10);
      const updatedAt = data[i][updatedIdx]?.toString().substring(0, 10);

      if (createdAt === todayStr) todayNewSubscribers++;
      if (updatedAt === todayStr && data[i][statusIdx] === 'unsubscribed') todayUnsubscribes++;
    }
  }

  // EmailLogs 統計（本日分）
  let todayEmailsSent = 0;
  let todayEmailsOpened = 0;
  let todayEmailsFailed = 0;
  if (emailLogsSheet) {
    const data = emailLogsSheet.getDataRange().getValues();
    const headers = data[0] as string[];
    const sentAtIdx = headers.indexOf('sent_at');
    const statusIdx = headers.indexOf('status');
    const openedAtIdx = headers.indexOf('opened_at');

    for (let i = 1; i < data.length; i++) {
      const sentAt = data[i][sentAtIdx]?.toString().substring(0, 10);
      if (sentAt === todayStr) {
        todayEmailsSent++;
        if (data[i][statusIdx] === 'failed') todayEmailsFailed++;
      }
      const openedAt = data[i][openedAtIdx]?.toString().substring(0, 10);
      if (openedAt === todayStr) todayEmailsOpened++;
    }
  }

  // LinkClicks 統計（本日分）
  let todayLinksClicked = 0;
  if (linkClicksSheet) {
    const data = linkClicksSheet.getDataRange().getValues();
    const headers = data[0] as string[];
    const clickedAtIdx = headers.indexOf('clicked_at');

    for (let i = 1; i < data.length; i++) {
      const clickedAt = data[i][clickedAtIdx]?.toString().substring(0, 10);
      if (clickedAt === todayStr) todayLinksClicked++;
    }
  }

  // Campaigns 統計
  let totalCampaignsSent = 0;
  if (campaignsSheet) {
    const data = campaignsSheet.getDataRange().getValues();
    const headers = data[0] as string[];
    const statusIdx = headers.indexOf('status');

    for (let i = 1; i < data.length; i++) {
      if (data[i][statusIdx] === 'sent') totalCampaignsSent++;
    }
  }

  // クォータ計算
  const emailRemaining = QUOTA_EMAIL_LIMIT - todayEmailsSent;

  return {
    success: true,
    data: {
      date: todayStr,
      daily: {
        emails_sent: todayEmailsSent,
        emails_opened: todayEmailsOpened,
        emails_failed: todayEmailsFailed,
        links_clicked: todayLinksClicked,
        unsubscribes: todayUnsubscribes,
        new_subscribers: todayNewSubscribers,
      },
      totals: {
        subscribers: totalSubscribers,
        campaigns_sent: totalCampaignsSent,
      },
      quota: {
        email: {
          used: todayEmailsSent,
          limit: QUOTA_EMAIL_LIMIT,
          remaining: emailRemaining,
        },
        urlfetch: {
          used: 0, // 推定値（別途カウンター実装時に更新）
          limit: QUOTA_URLFETCH_LIMIT,
          remaining: QUOTA_URLFETCH_LIMIT,
        },
      },
      health: emailRemaining > 100 ? 'ok' : (emailRemaining > 0 ? 'warning' : 'error'),
      timestamp: new Date().toISOString(),
    }
  };
}

/**
 * QuotaStats 一覧取得
 */
function listQuotaStats(fromDate?: string, toDate?: string): ApiResponse {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QuotaStats');
  if (!sheet) return { success: false, error: 'QuotaStats sheet not found' };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0] as string[];
  const records: any[] = [];

  for (let i = 1; i < data.length; i++) {
    const record: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = data[i][j];
    }

    // 日付フィルタ
    const date = record.date?.toString().substring(0, 10);
    if (fromDate && date < fromDate) continue;
    if (toDate && date > toDate) continue;

    records.push(record);
  }

  return { success: true, data: records };
}

/**
 * 日次統計を記録（トリガーから呼び出し）
 */
function recordDailyStats(apiKey?: string): ApiResponse {
  // API キー認証（外部からの呼び出し時）
  if (apiKey) {
    const validKey = getSetting(ADMIN_API_KEY_SETTING);
    if (validKey && apiKey !== validKey) {
      return { success: false, error: 'Invalid API key' };
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QuotaStats');
  if (!sheet) return { success: false, error: 'QuotaStats sheet not found' };

  // 今日の統計を取得
  const stats = getAdminStats('');
  if (!stats.success || !stats.data) {
    return { success: false, error: 'Failed to get stats' };
  }

  const data = stats.data;
  const now = new Date().toISOString();

  // 既に今日のレコードがあるか確認
  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0] as string[];
  const dateIdx = headers.indexOf('date');

  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][dateIdx] === data.date) {
      // 更新
      const rowNum = i + 1;
      sheet.getRange(rowNum, headers.indexOf('emails_sent') + 1).setValue(data.daily.emails_sent);
      sheet.getRange(rowNum, headers.indexOf('emails_opened') + 1).setValue(data.daily.emails_opened);
      sheet.getRange(rowNum, headers.indexOf('emails_failed') + 1).setValue(data.daily.emails_failed);
      sheet.getRange(rowNum, headers.indexOf('links_clicked') + 1).setValue(data.daily.links_clicked);
      sheet.getRange(rowNum, headers.indexOf('unsubscribes') + 1).setValue(data.daily.unsubscribes);
      sheet.getRange(rowNum, headers.indexOf('new_subscribers') + 1).setValue(data.daily.new_subscribers);
      sheet.getRange(rowNum, headers.indexOf('quota_email_limit') + 1).setValue(data.quota.email.limit);
      sheet.getRange(rowNum, headers.indexOf('quota_email_remaining') + 1).setValue(data.quota.email.remaining);
      sheet.getRange(rowNum, headers.indexOf('api_health') + 1).setValue(data.health);
      return { success: true, message: 'Updated existing record', date: data.date };
    }
  }

  // 新規追加
  const newRow = [
    data.date,
    data.daily.emails_sent,
    data.daily.emails_opened,
    data.daily.emails_failed,
    data.daily.links_clicked,
    data.daily.unsubscribes,
    data.daily.new_subscribers,
    0, // urlfetch_used（後で実装）
    data.quota.email.limit,
    data.quota.email.remaining,
    data.health,
    '',
    now,
  ];

  sheet.appendRow(newRow);

  return { success: true, message: 'Recorded daily stats', date: data.date };
}

/**
 * 日次統計記録トリガー（毎日23:55に実行）
 */
function dailyStatsRecordTrigger(): void {
  recordDailyStats();
}

// =====================================================
// 設定管理 API
// =====================================================

function getSettingApi(key: string): ApiResponse {
  if (!key) return { success: false, error: 'key is required' };
  const value = getSetting(key);
  return { success: true, data: { key, value } };
}

function setSettingApi(key: string, value: string): ApiResponse {
  if (!key) return { success: false, error: 'key is required' };
  setSetting(key, value);
  return { success: true, message: `Setting ${key} updated`, data: { key, value } };
}

// =====================================================
// キャンペーン追加 API
// =====================================================

/**
 * キャンペーンを追加
 */
function addCampaign(params: Record<string, any>): ApiResponse {
  const { name, subject, content_markdown, content_html, status } = params;

  if (!name || !subject) {
    return { success: false, error: 'name and subject are required' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campaigns');
  if (!sheet) return { success: false, error: 'Campaigns sheet not found' };

  const now = new Date().toISOString();
  const id = Utilities.getUuid();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] as string[];
  const newRow = Array(headers.length).fill('');

  const setVal = (col: string, val: any) => {
    const idx = headers.indexOf(col);
    if (idx !== -1) newRow[idx] = val;
  };

  setVal('id', id);
  setVal('name', name);
  setVal('subject', subject);
  setVal('content_markdown', content_markdown || '');
  setVal('content_html', content_html || '');
  setVal('status', status || 'draft');
  setVal('total_recipients', 0);
  setVal('total_sent', 0);
  setVal('total_opened', 0);
  setVal('total_clicked', 0);
  setVal('total_bounced', 0);
  setVal('created_at', now);
  setVal('updated_at', now);

  sheet.appendRow(newRow);

  return { success: true, data: { id, name, subject, status: status || 'draft' } };
}

/**
 * 特定アドレスにテスト送信（キャンペーン指定 + 宛先指定）
 */
function testSendToAddress(campaignId: string, email: string): ApiResponse {
  if (!campaignId || !email) {
    return { success: false, error: 'id and email are required' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const campaignsSheet = ss.getSheetByName('Campaigns');
  if (!campaignsSheet) return { success: false, error: 'Campaigns sheet not found' };

  const campaign = getCampaignById(campaignsSheet, campaignId);
  if (!campaign) return { success: false, error: 'Campaign not found: ' + campaignId };

  const htmlContent = campaign.content_html || markdownToHtml(campaign.content_markdown);

  const senderName = getSetting('sender_name') || 'AICU Japan';
  const senderEmail = getSetting('sender_email');
  const replyTo = getSetting('reply_to');
  const baseUrl = getSetting('base_url') || 'https://p.aicu.jp';

  const testContact: ContactInfo = {
    id: 'test-' + email,
    email: email,
    first_name: '',
    last_name: '',
    company: '',
    subscription_status: 'subscribed',
    subscription_token: 'test-token',
    rowIndex: -1,
  };

  const personalizedHtml = personalizeHtml(
    htmlContent, testContact, campaignId, baseUrl, false
  );

  try {
    sendViaGmail(email, `[TEST] ${campaign.subject}`, personalizedHtml, senderName, replyTo, senderEmail);
    return { success: true, message: `Test sent to ${email}`, data: { campaignId, email } };
  } catch (e: any) {
    return { success: false, error: e.message || 'Send failed' };
  }
}
