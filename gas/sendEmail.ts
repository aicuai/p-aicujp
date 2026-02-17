/**
 * AICU MailNews - Email Sending
 * Version: 1.3.0
 * Phase 1: GmailApp.sendEmail()
 * Phase 3: Resend API
 * 
 * Available Functions:
 * - sendCampaign: Main sending logic
 * - runTestDelivery: Test function for developers
 */

// =====================================================
// メール送信メイン
// =====================================================

/**
 * キャンペーンを送信
 * @param campaignId キャンペーンID
 * @param testMode テストモード（subscribedな最初の1人にだけ送信）
 */
function sendCampaign(campaignId: string, testMode: boolean = false): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const campaignsSheet = ss.getSheetByName('Campaigns');
  const contactsSheet = ss.getSheetByName('Contacts');
  const logsSheet = ss.getSheetByName('EmailLogs');

  if (!campaignsSheet || !contactsSheet || !logsSheet) {
    throw new Error('Required sheets not found');
  }

  // キャンペーン取得
  const campaign = getCampaignById(campaignsSheet, campaignId);
  if (!campaign) {
    throw new Error('Campaign not found: ' + campaignId);
  }

  if (campaign.status === 'sent' && !testMode) {
    throw new Error('Campaign already sent');
  }

  // HTML生成
  const htmlContent = campaign.content_html || markdownToHtml(campaign.content_markdown);

  // 送信対象取得
  const contacts = getSubscribedContactsList(contactsSheet);
  const recipients = testMode ? contacts.slice(0, 1) : contacts;

  if (recipients.length === 0) {
    throw new Error('No recipients found');
  }

  // 設定取得
  const senderName = getSetting('sender_name') || 'AICU Japan';
  const replyTo = getSetting('reply_to') || '';
  const batchSize = parseInt(getSetting('batch_size') || '100', 10);
  const baseUrl = getSetting('base_url') || 'https://p.aicu.jp';
  const trackingEnabled = getSetting('tracking_enabled') === 'true';
  const currentPhase = parseInt(getSetting('current_phase') || '1', 10);

  // ステータス更新
  if (!testMode) {
    updateCampaignField(campaignsSheet, campaignId, 'status', 'sending');
    updateCampaignField(campaignsSheet, campaignId, 'total_recipients', recipients.length);
  }

  let sentCount = 0;
  let errorCount = 0;

  // バッチ送信
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    batch.forEach(contact => {
      try {
        // 個別化HTML生成
        const personalizedHtml = personalizeHtml(
          htmlContent,
          contact,
          campaignId,
          baseUrl,
          trackingEnabled
        );

        // 送信
        if (currentPhase === 1 || currentPhase === 2) {
          const senderEmail = getSetting('sender_email');
          sendViaGmail(contact.email, campaign.subject, personalizedHtml, senderName, replyTo, senderEmail);
        } else {
          sendViaResend(contact.email, campaign.subject, personalizedHtml, senderName, replyTo);
        }

        // ログ記録
        logEmailSent(logsSheet, campaignId, contact, 'sent');

        // コンタクト更新
        updateContactEmailStats(contactsSheet, contact.email);

        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${contact.email}:`, error);
        logEmailSent(logsSheet, campaignId, contact, 'failed',
          error instanceof Error ? error.message : 'Unknown error');
        errorCount++;
      }
    });

    // バッチ間隔（レート制限対策）
    if (i + batchSize < recipients.length) {
      const intervalMinutes = parseInt(getSetting('batch_interval_minutes') || '5', 10);
      Utilities.sleep(intervalMinutes * 60 * 1000);
    }
  }

  // 完了更新
  if (!testMode) {
    updateCampaignField(campaignsSheet, campaignId, 'status', 'sent');
    updateCampaignField(campaignsSheet, campaignId, 'sent_at', new Date().toISOString());
    updateCampaignField(campaignsSheet, campaignId, 'total_sent', sentCount);
  }

  console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${errorCount} errors`);
}

// =====================================================
// Gmail送信（Phase 1）
// =====================================================

function sendViaGmail(
  to: string,
  subject: string,
  htmlBody: string,
  senderName: string,
  replyTo: string,
  fromEmail?: string
): void {
  const options: GoogleAppsScript.Mail.MailAdvancedParameters = {
    htmlBody,
    name: senderName,
  };

  if (replyTo) {
    options.replyTo = replyTo;
  }

  // エイリアスとして設定されている場合のみ有効
  if (fromEmail) {
    (options as any).from = fromEmail;
  }

  GmailApp.sendEmail(to, subject, '', options);
}

// =====================================================
// Resend送信（Phase 3）
// =====================================================

function sendViaResend(
  to: string,
  subject: string,
  htmlBody: string,
  senderName: string,
  replyTo: string
): void {
  const apiKey = getSetting('resend_api_key');
  const senderEmail = getSetting('sender_email');

  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }

  const payload = {
    from: `${senderName} <${senderEmail}>`,
    to: [to],
    subject,
    html: htmlBody,
  };

  if (replyTo) {
    (payload as any).reply_to = replyTo;
  }

  const response = UrlFetchApp.fetch('https://api.resend.com/emails', {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const result = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    throw new Error(result.message || 'Resend API error');
  }
}

// =====================================================
// HTML生成
// =====================================================

/**
 * Markdown → HTML変換（シンプル版）
 */
function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  return html;
}

/**
 * HTMLを個別化（名前差し込み、トラッキングリンク、配信停止リンク）
 */
function personalizeHtml(
  html: string,
  contact: ContactInfo,
  campaignId: string,
  baseUrl: string,
  trackingEnabled: boolean
): string {
  // 名前差し込み
  const hasName = ((contact.last_name || '') + (contact.first_name || '')).trim();
  let personalized = html
    .replace(/{{first_name}}/g, contact.first_name || '')
    .replace(/{{last_name}}/g, contact.last_name || '')
    .replace(/{{email}}/g, contact.email)
    .replace(/{{company}}/g, contact.company || '');

  // 名前が空の場合、孤立した「さま」を除去
  if (!hasName) {
    personalized = personalized.replace(/\s*さま/g, '');
  }

  // リンクトラッキング
  if (trackingEnabled) {
    personalized = personalized.replace(
      /<a href="([^"]+)"([^>]*)>/g,
      (match, url, rest) => {
        // 配信停止リンクはトラッキングしない
        if (url.includes('mailnews') || url.includes('unsubscribe')) {
          return match;
        }
        const trackingUrl = `${baseUrl}/link?` +
          `email=${encodeURIComponent(contact.email)}` +
          `&campaign_id=${encodeURIComponent(campaignId)}` +
          `&url=${encodeURIComponent(url)}`;
        return `<a href="${trackingUrl}"${rest}>`;
      }
    );
  }

  // 配信停止リンク追加
  const unsubscribeUrl = `${baseUrl}/mailnews?` +
    `email=${encodeURIComponent(contact.email)}` +
    `&token=${encodeURIComponent(contact.subscription_token)}`;

  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      <p>
        このメールは ${contact.email} 宛に送信されています。<br>
        <a href="${unsubscribeUrl}">配信停止はこちら</a>
      </p>
      <p>
        AICU Inc.<br>
        <a href="https://aicu.jp">https://aicu.jp</a>
      </p>
    </div>
  `;

  // bodyタグがあれば中に、なければ末尾に追加
  if (personalized.includes('</body>')) {
    personalized = personalized.replace('</body>', footer + '</body>');
  } else {
    personalized = personalized + footer;
  }

  return wrapInEmailTemplate(personalized);
}

/**
 * HTMLメールテンプレートでラップ
 */
function wrapInEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #1a1a1a;
    }
    a {
      color: #0066cc;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `.trim();
}

// =====================================================
// データアクセス
// =====================================================

interface CampaignInfo {
  id: string;
  name: string;
  subject: string;
  content_markdown: string;
  content_html: string;
  status: string;
  rowIndex: number;
}

interface ContactInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  subscription_status: string;
  subscription_token: string;
  rowIndex: number;
}

function getCampaignById(sheet: GoogleAppsScript.Spreadsheet.Sheet, campaignId: string): CampaignInfo | null {
  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const idIdx = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === campaignId) {
      return {
        id: data[i][idIdx],
        name: data[i][headers.indexOf('name')],
        subject: data[i][headers.indexOf('subject')],
        content_markdown: data[i][headers.indexOf('content_markdown')],
        content_html: data[i][headers.indexOf('content_html')],
        status: data[i][headers.indexOf('status')],
        rowIndex: i + 1,
      };
    }
  }
  return null;
}

function getSubscribedContactsList(sheet: GoogleAppsScript.Spreadsheet.Sheet): ContactInfo[] {
  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const statusIdx = headers.indexOf('subscription_status');

  const contacts: ContactInfo[] = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][statusIdx] === 'subscribed') {
      contacts.push({
        id: data[i][headers.indexOf('id')],
        email: data[i][headers.indexOf('email')],
        first_name: data[i][headers.indexOf('first_name')],
        last_name: data[i][headers.indexOf('last_name')],
        company: data[i][headers.indexOf('company')],
        subscription_status: data[i][statusIdx],
        subscription_token: data[i][headers.indexOf('subscription_token')],
        rowIndex: i + 1,
      });
    }
  }

  return contacts;
}

function updateCampaignField(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  campaignId: string,
  field: string,
  value: any
): void {
  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const idIdx = headers.indexOf('id');
  const fieldIdx = headers.indexOf(field);

  if (fieldIdx === -1) return;

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === campaignId) {
      sheet.getRange(i + 1, fieldIdx + 1).setValue(value);

      // updated_at も更新
      const updatedIdx = headers.indexOf('updated_at');
      if (updatedIdx !== -1) {
        sheet.getRange(i + 1, updatedIdx + 1).setValue(new Date().toISOString());
      }
      return;
    }
  }
}

function logEmailSent(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  campaignId: string,
  contact: ContactInfo,
  status: string,
  errorMessage?: string
): void {
  const now = new Date().toISOString();
  sheet.appendRow([
    Utilities.getUuid(),
    campaignId,
    contact.id,
    contact.email,
    status,
    now,      // sent_at
    '',       // delivered_at
    '',       // opened_at
    '',       // bounce_reason
    errorMessage || '',
  ]);
}

function updateContactEmailStats(sheet: GoogleAppsScript.Spreadsheet.Sheet, email: string): void {
  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const emailIdx = headers.indexOf('email');

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIdx]?.toString().toLowerCase() === email.toLowerCase()) {
      const lastSentIdx = headers.indexOf('last_email_sent');
      const totalSentIdx = headers.indexOf('total_emails_sent');
      const updatedIdx = headers.indexOf('updated_at');

      const now = new Date().toISOString();

      if (lastSentIdx !== -1) {
        sheet.getRange(i + 1, lastSentIdx + 1).setValue(now);
      }
      if (totalSentIdx !== -1) {
        const current = parseInt(data[i][totalSentIdx]?.toString() || '0', 10);
        sheet.getRange(i + 1, totalSentIdx + 1).setValue(current + 1);
      }
      if (updatedIdx !== -1) {
        sheet.getRange(i + 1, updatedIdx + 1).setValue(now);
      }
      return;
    }
  }
}

// =====================================================
// トリガー・スケジュール
// =====================================================

/**
 * 毎週水曜日のトリガーを設定
 */
function setupWeeklyTrigger(): void {
  // 既存トリガー削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'weeklyNewsletterTrigger') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 新規トリガー作成（毎週水曜10時）
  ScriptApp.newTrigger('weeklyNewsletterTrigger')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.WEDNESDAY)
    .atHour(10)
    .create();

  console.log('Weekly trigger set for Wednesday 10:00 AM');
}

/**
 * 週刊ニュースレター送信トリガー
 */
function weeklyNewsletterTrigger(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campaigns');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const statusIdx = headers.indexOf('status');
  const idIdx = headers.indexOf('id');

  // scheduled ステータスのキャンペーンを送信
  for (let i = 1; i < data.length; i++) {
    if (data[i][statusIdx] === 'scheduled') {
      const campaignId = data[i][idIdx];
      try {
        sendCampaign(campaignId, false);
      } catch (error) {
        console.error(`Failed to send campaign ${campaignId}:`, error);
      }
    }
  }
}

// =====================================================
// テスト用関数
// =====================================================

/**
 * テスト送信（最初の1人に送信）
 */
function testSendCampaign(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campaigns');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Campaignsシートがありません');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');

  // draftのキャンペーンを探す
  for (let i = 1; i < data.length; i++) {
    if (data[i][statusIdx] === 'draft') {
      const campaignId = data[i][idIdx];
      sendCampaign(campaignId, true);
      SpreadsheetApp.getUi().alert(`テスト送信完了: ${campaignId}`);
      return;
    }
  }

  SpreadsheetApp.getUi().alert('draftステータスのキャンペーンがありません');
}

/**
 * 特定のアドレスにテスト送信（開発用）
 * ターゲット: akihiko.shirai@gmail.com
 */
function runTestDelivery(): void {
  const targetEmail = 'akihiko.shirai@gmail.com'; // 固定ターゲット
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const campaignsSheet = ss.getSheetByName('Campaigns');

  if (!campaignsSheet) {
    console.error('Campaigns sheet not found');
    return;
  }

  // 最新のdraftキャンペーンを取得
  const data = campaignsSheet.getDataRange().getValues();
  const headers = data[0] as string[];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');

  let targetCampaignId = '';

  for (let i = 1; i < data.length; i++) {
    if (data[i][statusIdx] === 'draft') {
      targetCampaignId = data[i][idIdx];
      break; // 最初に見つかったdraftを使用
    }
  }

  if (!targetCampaignId) {
    console.warn('No draft campaign found. Using dummy data for safety.');
    return;
  }

  console.log(`Starting test delivery of ${targetCampaignId} to ${targetEmail}`);

  // テスト用コンタクトオブジェクト作成
  const testContact: ContactInfo = {
    id: 'test-user-id',
    email: targetEmail,
    first_name: 'Test',
    last_name: 'User',
    company: 'AICU Inc.',
    subscription_status: 'subscribed',
    subscription_token: 'test-token',
    rowIndex: -1
  };

  // キャンペーン情報取得（既存関数再利用）
  const campaign = getCampaignById(campaignsSheet, targetCampaignId);
  if (!campaign) return;

  // HTML生成
  const htmlContent = campaign.content_html || markdownToHtml(campaign.content_markdown);

  // 設定取得
  const senderName = getSetting('sender_name') || 'AICU Japan';
  const senderEmail = getSetting('sender_email'); // info@aicu.jp
  const replyTo = getSetting('reply_to');
  const baseUrl = getSetting('base_url');

  const personalizedHtml = personalizeHtml(
    htmlContent,
    testContact,
    targetCampaignId,
    baseUrl,
    false // tracking disabled for test
  );

  // Gmail送信（強制Phase 1）
  try {
    sendViaGmail(targetEmail, `[TEST] ${campaign.subject}`, personalizedHtml, senderName, replyTo, senderEmail);
    console.log('Test email sent successfully');
    SpreadsheetApp.getUi().alert(`テスト送信成功\nTo: ${targetEmail}\nSubject: ${campaign.subject}`);
  } catch (e: any) {
    console.error('Test send failed', e);
    SpreadsheetApp.getUi().alert(`送信失敗: ${e.message}`);
  }
}
