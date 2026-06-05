require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./database');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userStates = {};

function isAdmin(userId) {
  return ADMIN_IDS.includes(String(userId));
}

function getChannels() {
  return db.prepare('SELECT * FROM channels').all();
}

function getConfigs() {
  return db.prepare('SELECT * FROM configs WHERE is_used = 0').all();
}

function getSubscriptions() {
  return db.prepare('SELECT * FROM subscriptions').all();
}

function getProxies() {
  return db.prepare('SELECT * FROM proxies WHERE is_used = 0').all();
}

function getUserState(userId) {
  return userStates[userId] || { step: 'idle', data: {} };
}

function setUserState(userId, step, data = {}) {
  userStates[userId] = { step, data };
}

function clearUserState(userId) {
  delete userStates[userId];
}

async function checkChannelMembership(userId) {
  const channels = getChannels();
  if (channels.length === 0) return { valid: true, notJoined: [] };

  const notJoined = [];
  for (const ch of channels) {
    try {
      const member = await bot.getChatMember(ch.channel_id, userId);
      if (['left', 'kicked', 'restricted'].includes(member.status)) {
        notJoined.push(ch);
      }
    } catch (e) {
      notJoined.push(ch);
    }
  }
  return { valid: notJoined.length === 0, notJoined };
}

function getMainKeyboard(userId) {
  if (isAdmin(userId)) {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '📨 درخواست کانفیگ' }, { text: '🔗 لینک ساب' }],
          [{ text: '🌐 پروکسی تلگرام' }],
          [{ text: '⚙️ پنل مدیریت' }]
        ],
        resize_keyboard: true
      }
    };
  }
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📨 درخواست کانفیگ' }, { text: '🔗 لینک ساب' }],
        [{ text: '🌐 پروکسی تلگرام' }]
      ],
      resize_keyboard: true
    }
  };
}

function getAdminKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📢 مدیریت کانال‌ها' }, { text: '📦 مدیریت کانفیگ‌ها' }],
        [{ text: '🔄 مدیریت ساب' }, { text: '🔗 مدیریت پروکسی' }],
        [{ text: '🔙 بازگشت' }]
      ],
      resize_keyboard: true
    }
  };
}

function getChannelInlineButtons(channels) {
  if (!channels || channels.length === 0) return null;
  const buttons = channels.map(ch => [
    { text: ch.channel_title || ch.channel_id, url: `https://t.me/${ch.channel_id.replace('@', '')}` }
  ]);
  buttons.push([{ text: '✅ بررسی عضویت', callback_data: 'check_membership' }]);
  return { reply_markup: { inline_keyboard: buttons } };
}

function getConfigInlineButton(configId, configText) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 کپی کانفیگ', callback_data: `copy_config_${configId}` }]
      ]
    }
  };
}

function getProxyInlineButton(proxyId, proxyLink) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 اتصال به پروکسی', url: proxyLink }]
      ]
    }
  };
}

function getSubInlineButtons(subId, subLink) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 کپی لینک ساب', callback_data: `copy_sub_${subId}` }],
        [{ text: '📱 اسکن QR', callback_data: `qr_sub_${subId}` }]
      ]
    }
  };
}

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  db.prepare(`
    INSERT OR IGNORE INTO users (user_id, username, first_name)
    VALUES (?, ?, ?)
  `).run(String(userId), msg.from.username || '', msg.from.first_name || '');

  const { valid, notJoined } = await checkChannelMembership(userId);

  if (!valid) {
    const channels = getChannels();
    const inlineButtons = getChannelInlineButtons(channels);
    await bot.sendMessage(chatId,
      '⚠️ برای استفاده از ربات ابتدا باید در کانال‌های زیر عضو شوید:',
      inlineButtons
    );
    return;
  }

  await bot.sendMessage(chatId, '🎉 به ربات خوش آمدید!\nاز منوی زیر استفاده کنید:', getMainKeyboard(userId));
});

bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'check_membership') {
    const { valid, notJoined } = await checkChannelMembership(userId);

    if (valid) {
      await bot.answerCallbackQuery(query.id, '✅ عضویت شما تایید شد!');
      await bot.editMessageText('🎉 عضویت شما تایید شد! اکنون می‌توانید از ربات استفاده کنید.', {
        chat_id: chatId,
        message_id: query.message.message_id
      });
      await bot.sendMessage(chatId, 'از منوی زیر استفاده کنید:', getMainKeyboard(userId));
    } else {
      const notJoinedNames = notJoined.map(ch => ch.channel_title || ch.channel_id).join('\n');
      await bot.answerCallbackQuery(query.id, `⚠️ هنوز در ${notJoined.length} کانال عضو نیستید!`);
    }
  }

  if (data.startsWith('copy_config_')) {
    const configId = data.replace('copy_config_', '');
    const config = db.prepare('SELECT * FROM configs WHERE id = ?').get(configId);
    if (config) {
      await bot.answerCallbackQuery(query.id, '✅ کانفیگ کپی شد!');
      await bot.sendMessage(chatId, `📋 کانفیگ شما:\n\n<code>${config.config_text}</code>`, { parse_mode: 'HTML' });
    }
  }

  if (data.startsWith('copy_sub_')) {
    const subId = data.replace('copy_sub_', '');
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subId);
    if (sub) {
      await bot.answerCallbackQuery(query.id, '✅ لینک ساب کپی شد!');
      await bot.sendMessage(chatId, `🔗 لینک ساب شما:\n\n<code>${sub.sub_link}</code>`, { parse_mode: 'HTML' });
    }
  }

  if (data.startsWith('qr_sub_')) {
    const subId = data.replace('qr_sub_', '');
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subId);
    if (sub && sub.qr_code) {
      await bot.answerCallbackQuery(query.id, '✅ QR ارسال شد!');
      await bot.sendMessage(chatId, sub.qr_code);
    } else {
      await bot.answerCallbackQuery(query.id, '❌ QR موجود نیست');
    }
  }
});

bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  const userState = getUserState(userId);

  if (text === '⚙️ پنل مدیریت' && isAdmin(userId)) {
    await bot.sendMessage(chatId, '⚙️ پنل مدیریت', getAdminKeyboard());
    return;
  }

  if (text === '🔙 بازگشت' && isAdmin(userId)) {
    clearUserState(userId);
    await bot.sendMessage(chatId, '🏠 منوی اصلی', getMainKeyboard(userId));
    return;
  }

  if (isAdmin(userId) && userState.step !== 'idle') {
    await handleAdminState(userId, chatId, text, userState);
    return;
  }

  if (isAdmin(userId)) {
    switch (text) {
      case '📢 مدیریت کانال‌ها':
        await showChannelManagement(chatId);
        break;
      case '📦 مدیریت کانفیگ‌ها':
        await showConfigManagement(chatId);
        break;
      case '🔄 مدیریت ساب':
        await showSubManagement(chatId);
        break;
      case '🔗 مدیریت پروکسی':
        await showProxyManagement(chatId);
        break;
    }
  }

  const { valid, notJoined } = await checkChannelMembership(userId);
  if (!valid) {
    const channels = getChannels();
    const inlineButtons = getChannelInlineButtons(channels);
    await bot.sendMessage(chatId,
      '⚠️ برای استفاده از ربات ابتدا باید در کانال‌های زیر عضو شوید:',
      inlineButtons
    );
    return;
  }

  switch (text) {
    case '📨 درخواست کانفیگ':
      await handleConfigRequest(chatId, userId);
      break;
    case '🔗 لینک ساب':
      await handleSubRequest(chatId, userId);
      break;
    case '🌐 پروکسی تلگرام':
      await handleProxyRequest(chatId, userId);
      break;
  }
});

const ADMIN_MENU_BUTTONS = [
  '📢 مدیریت کانال‌ها', '📦 مدیریت کانفیگ‌ها',
  '🔄 مدیریت ساب', '🔗 مدیریت پروکسی',
  '➕ اضافه کردن کانال', '➖ حذف کانال',
  '➕ اضافه کردن کانفیگ', '➖ حذف کانفیگ',
  '➕ اضافه کردن ساب', '➖ حذف ساب',
  '➕ اضافه کردن پروکسی', '➖ حذف پروکسی',
  '⚙️ پنل مدیریت', '🔙 بازگشت'
];

async function handleAdminState(userId, chatId, text, userState) {
  if (text === '✖️ لغو' || ADMIN_MENU_BUTTONS.includes(text)) {
    if (text === '✖️ لغو') {
      clearUserState(userId);
      await bot.sendMessage(chatId, '❌ عملیات لغو شد.', getAdminKeyboard());
      return;
    }

    if (text === '🔙 بازگشت') {
      clearUserState(userId);
      await bot.sendMessage(chatId, '🏠 منوی اصلی', getMainKeyboard(userId));
      return;
    }

    clearUserState(userId);
    if (text === '📢 مدیریت کانال‌ها') { await showChannelManagement(chatId); return; }
    if (text === '📦 مدیریت کانفیگ‌ها') { await showConfigManagement(chatId); return; }
    if (text === '🔄 مدیریت ساب') { await showSubManagement(chatId); return; }
    if (text === '🔗 مدیریت پروکسی') { await showProxyManagement(chatId); return; }

    if (text === '➕ اضافه کردن کانفیگ') {
      setUserState(userId, 'add_config_input');
      await bot.sendMessage(chatId, '📝 متن کانفیگ v2ray را ارسال کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➖ حذف کانفیگ') {
      setUserState(userId, 'delete_config_input');
      await bot.sendMessage(chatId, '🔢 شناسه (ID) کانفیگ مورد نظر را وارد کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➕ اضافه کردن پروکسی') {
      setUserState(userId, 'add_proxy_input');
      await bot.sendMessage(chatId, '📝 لینک پروکسی تلگرام را ارسال کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➖ حذف پروکسی') {
      setUserState(userId, 'delete_proxy_input');
      await bot.sendMessage(chatId, '🔢 شناسه (ID) پروکسی مورد نظر را وارد کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➕ اضافه کردن ساب') {
      setUserState(userId, 'add_sub_link_input');
      await bot.sendMessage(chatId, '📝 لینک ساب را ارسال کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➖ حذف ساب') {
      setUserState(userId, 'delete_sub_input');
      await bot.sendMessage(chatId, '🔢 شناسه (ID) ساب مورد نظر را وارد کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➕ اضافه کردن کانال') {
      setUserState(userId, 'add_channel_input');
      await bot.sendMessage(chatId, '📝 آیدی عددی یا یوزرنیم کانال را ارسال کنید (مثال: @mychannel یا -1001234567890):', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }
    if (text === '➖ حذف کانال') {
      setUserState(userId, 'delete_channel_input');
      await bot.sendMessage(chatId, '🔢 آیدی کانال مورد نظر را وارد کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      return;
    }

    return;
  }

  switch (userState.step) {
    case 'add_channel_input': {
      try {
        const chat = await bot.getChat(text);
        db.prepare('INSERT OR IGNORE INTO channels (channel_id, channel_title) VALUES (?, ?)').run(text, chat.title || text);
        clearUserState(userId);
        await bot.sendMessage(chatId, `✅ کانال "${chat.title || text}" اضافه شد.`, getAdminKeyboard());
      } catch (e) {
        await bot.sendMessage(chatId, '❌ خطا در اضافه کردن کانال. مطمئن شوید ربات در کانال ادمین است.');
      }
      break;
    }

    case 'add_config_input':
      db.prepare('INSERT INTO configs (config_text) VALUES (?)').run(text);
      clearUserState(userId);
      await bot.sendMessage(chatId, '✅ کانفیگ اضافه شد.', getAdminKeyboard());
      break;

    case 'add_sub_link_input':
      setUserState(userId, 'add_sub_qr_input', { sub_link: text });
      await bot.sendMessage(chatId, '📱 QR کد ساب (اختیاری):\nاگر QR ندارید عبارت "-" را وارد کنید:', {
        reply_markup: { keyboard: [[{ text: '✖️ لغو' }]], resize_keyboard: true }
      });
      break;

    case 'add_sub_qr_input': {
      const subLink = userState.data.sub_link;
      const qr = text === '-' ? '' : text;
      db.prepare('INSERT INTO subscriptions (sub_link, qr_code) VALUES (?, ?)').run(subLink, qr);
      clearUserState(userId);
      await bot.sendMessage(chatId, '✅ لینک ساب اضافه شد.', getAdminKeyboard());
      break;
    }

    case 'add_proxy_input':
      db.prepare('INSERT INTO proxies (proxy_link) VALUES (?)').run(text);
      clearUserState(userId);
      await bot.sendMessage(chatId, '✅ پروکسی اضافه شد.', getAdminKeyboard());
      break;

    case 'delete_channel_input': {
      const deleted = db.prepare('DELETE FROM channels WHERE channel_id = ?').run(text);
      clearUserState(userId);
      await bot.sendMessage(chatId, deleted.changes ? '✅ کانال حذف شد.' : '❌ کانال یافت نشد.', getAdminKeyboard());
      break;
    }

    case 'delete_config_input': {
      const delConfig = db.prepare('DELETE FROM configs WHERE id = ?').run(parseInt(text));
      clearUserState(userId);
      await bot.sendMessage(chatId, delConfig.changes ? '✅ کانفیگ حذف شد.' : '❌ کانفیگ یافت نشد.', getAdminKeyboard());
      break;
    }

    case 'delete_sub_input': {
      const delSub = db.prepare('DELETE FROM subscriptions WHERE id = ?').run(parseInt(text));
      clearUserState(userId);
      await bot.sendMessage(chatId, delSub.changes ? '✅ ساب حذف شد.' : '❌ ساب یافت نشد.', getAdminKeyboard());
      break;
    }

    case 'delete_proxy_input': {
      const delProxy = db.prepare('DELETE FROM proxies WHERE id = ?').run(parseInt(text));
      clearUserState(userId);
      await bot.sendMessage(chatId, delProxy.changes ? '✅ پروکسی حذف شد.' : '❌ پروکسی یافت نشد.', getAdminKeyboard());
      break;
    }
  }
}

async function showChannelManagement(chatId) {
  const channels = getChannels();
  let text = '📢 مدیریت کانال‌های اجباری:\n\n';
  if (channels.length === 0) {
    text += 'هیچ کانالی ثبت نشده.\n';
  } else {
    channels.forEach((ch, i) => {
      text += `${i + 1}. ${ch.channel_title || ch.channel_id} (${ch.channel_id})\n`;
    });
  }
  setUserState(chatId, 'channel_menu');
  await bot.sendMessage(chatId, text, {
    reply_markup: {
      keyboard: [
        [{ text: '➕ اضافه کردن کانال' }, { text: '➖ حذف کانال' }],
        [{ text: '✖️ لغو' }]
      ],
      resize_keyboard: true
    }
  });
}

async function showConfigManagement(chatId) {
  const configs = getConfigs();
  let text = '📦 مدیریت کانفیگ‌ها:\n\n';
  text += `تعداد کانفیگ‌های موجود: ${configs.length}\n\n`;
  if (configs.length > 0) {
    configs.slice(0, 10).forEach((c, i) => {
      text += `${i + 1}. ID: ${c.id} | ${c.config_text.substring(0, 30)}...\n`;
    });
  }
  setUserState(chatId, 'config_menu');
  await bot.sendMessage(chatId, text, {
    reply_markup: {
      keyboard: [
        [{ text: '➕ اضافه کردن کانفیگ' }, { text: '➖ حذف کانفیگ' }],
        [{ text: '✖️ لغو' }]
      ],
      resize_keyboard: true
    }
  });
}

async function showSubManagement(chatId) {
  const subs = getSubscriptions();
  let text = '🔄 مدیریت ساب:\n\n';
  if (subs.length === 0) {
    text += 'هیچ سابی ثبت نشده.\n';
  } else {
    subs.forEach((s, i) => {
      text += `${i + 1}. ID: ${s.id} | ${s.sub_link.substring(0, 40)}...\n`;
    });
  }
  setUserState(chatId, 'sub_menu');
  await bot.sendMessage(chatId, text, {
    reply_markup: {
      keyboard: [
        [{ text: '➕ اضافه کردن ساب' }, { text: '➖ حذف ساب' }],
        [{ text: '✖️ لغو' }]
      ],
      resize_keyboard: true
    }
  });
}

async function showProxyManagement(chatId) {
  const proxies = getProxies();
  let text = '🔗 مدیریت پروکسی‌ها:\n\n';
  text += `تعداد پروکسی‌های موجود: ${proxies.length}\n\n`;
  if (proxies.length > 0) {
    proxies.slice(0, 10).forEach((p, i) => {
      text += `${i + 1}. ID: ${p.id} | ${p.proxy_link.substring(0, 40)}...\n`;
    });
  }
  setUserState(chatId, 'proxy_menu');
  await bot.sendMessage(chatId, text, {
    reply_markup: {
      keyboard: [
        [{ text: '➕ اضافه کردن پروکسی' }, { text: '➖ حذف پروکسی' }],
        [{ text: '✖️ لغو' }]
      ],
      resize_keyboard: true
    }
  });
}

async function handleConfigRequest(chatId, userId) {
  const configs = getConfigs();
  if (configs.length === 0) {
    await bot.sendMessage(chatId, '❌ در حال حاضر کانفیگی موجود نیست.');
    return;
  }
  const config = configs[0];
  db.prepare('UPDATE configs SET is_used = 1 WHERE id = ?').run(config.id);
  await bot.sendMessage(chatId, '📨 کانفیگ شما:', getConfigInlineButton(config.id, config.config_text));
}

async function handleSubRequest(chatId, userId) {
  const subs = getSubscriptions();
  if (subs.length === 0) {
    await bot.sendMessage(chatId, '❌ در حال حاضر لینک سابی موجود نیست.');
    return;
  }
  const sub = subs[0];
  await bot.sendMessage(chatId, '🔗 لینک ساب شما:', getSubInlineButtons(sub.id, sub.sub_link));
}

async function handleProxyRequest(chatId, userId) {
  const proxies = getProxies();
  if (proxies.length === 0) {
    await bot.sendMessage(chatId, '❌ در حال حاضر پروکسی‌ای موجود نیست.');
    return;
  }
  const proxy = proxies[0];
  db.prepare('UPDATE proxies SET is_used = 1 WHERE id = ?').run(proxy.id);
  await bot.sendMessage(chatId, '🌐 پروکسی تلگرام شما:', getProxyInlineButton(proxy.id, proxy.proxy_link));
}

const app = express();
app.get('/', (req, res) => {
  res.json({ status: 'Bot is running', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

console.log('Bot is starting...');
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code);
});
