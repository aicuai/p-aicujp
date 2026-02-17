/**
 * AICU MailNews - Main Entry Point
 * 
 * スプレッドシートのスクリプトエディタから実行するカスタムメニュー
 */

// =====================================================
// カスタムメニュー
// =====================================================

function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 MailNews')
    .addItem('🔧 テーブル初期化', 'initTables')
    .addItem('📥 Hubspotインポート', 'importFromHubspot')
    .addSeparator()
    .addItem('📤 テスト送信', 'testSendCampaign')
    .addItem('📤 キャンペーン送信', 'showSendDialog')
    .addSeparator()
    .addItem('⏰ 週刊トリガー設定', 'setupWeeklyTrigger')
    .addItem('📊 統計表示', 'showStatistics')
    .addSeparator()
    .addItem('🔗 WebApp URL確認', 'showWebAppUrl')
    .addToUi();
}

// =====================================================
// UI ダイアログ
// =====================================================

function showSendDialog(): void {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'キャンペーン送信',
    'キャンペーンIDを入力してください:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    const campaignId = result.getResponseText().trim();
    if (campaignId) {
      const confirm = ui.alert(
        '確認',
        `キャンペーン「${campaignId}」を全購読者に送信しますか？`,
        ui.ButtonSet.YES_NO
      );
      
      if (confirm === ui.Button.YES) {
        try {
          sendCampaign(campaignId, false);
          ui.alert('送信完了', '送信が完了しました。EmailLogsシートを確認してください。', ui.ButtonSet.OK);
        } catch (error) {
          ui.alert('エラー', error instanceof Error ? error.message : 'Unknown error', ui.ButtonSet.OK);
        }
      }
    }
  }
}

function showStatistics(): void {
  const stats = getStatistics();
  const ui = SpreadsheetApp.getUi();
  
  if (!stats.success) {
    ui.alert('エラー', stats.error || 'Unknown error', ui.ButtonSet.OK);
    return;
  }
  
  const data = stats.data;
  const message = `
📊 MailNews 統計
━━━━━━━━━━━━━━━━━━━━
👥 コンタクト
  総数: ${data.contacts.total}
  購読中: ${data.contacts.subscribed}
  停止: ${data.contacts.unsubscribed}
  バウンス: ${data.contacts.bounced}

📧 メール送信
  総数: ${data.emails.total}

🔗 リンククリック
  総数: ${data.clicks.total}
━━━━━━━━━━━━━━━━━━━━
  `.trim();
  
  ui.alert('統計', message, ui.ButtonSet.OK);
}

function showWebAppUrl(): void {
  const ui = SpreadsheetApp.getUi();
  const url = ScriptApp.getService().getUrl();
  
  if (url) {
    ui.alert('WebApp URL', `現在のWebApp URL:\n${url}\n\nこのURLをVercel側の環境変数に設定してください。`, ui.ButtonSet.OK);
  } else {
    ui.alert('WebApp URL', 'WebAppがデプロイされていません。\n「デプロイ」→「新しいデプロイ」からWebアプリとしてデプロイしてください。', ui.ButtonSet.OK);
  }
}

// =====================================================
// グローバルエクスポート（clasp用）
// =====================================================

// initTables.ts
declare function initTables(): void;
declare function importFromHubspot(): void;
declare function getSetting(key: string): string;
declare function setSetting(key: string, value: string): void;
declare function getSubscribedContacts(): any[][];

// api.ts  
declare function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput;
declare function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput;
declare function getStatistics(): { success: boolean; error?: string; data?: any };

// sendEmail.ts
declare function sendCampaign(campaignId: string, testMode?: boolean): void;
declare function testSendCampaign(): void;
declare function setupWeeklyTrigger(): void;
declare function weeklyNewsletterTrigger(): void;
