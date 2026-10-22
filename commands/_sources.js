/*CMD
  command: /sources
  help: عرض وإدارة مصادر المراقبة
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 📋 إدارة المصادر, المصادر
CMD*/

var text = "📋 **قائمة مصادر المراقبة (sources.json):**\n\n" +
  "1. [telegram] **أخبار الجامعة والقبول الرسمي**\n   الهدف: `@KSU_News` | القاعدة: رسمي [نشر مباشر] | الأولوية: عالي\n\n" +
  "2. [twitter] **الحساب الرسمي لوزارة التعليم**\n   الهدف: `@moe_gov_sa` | القاعدة: رسمي [نشر مباشر] | الأولوية: عالي\n\n" +
  "➕ لإضافة مصدر أو قناة جديدة بسهولة، اضغط: `➕ إضافة قناة أو رابط`\n" +
  "➖ لحذف أي مصدر أرسل: `/remove_source @channel`";

Bot.sendMessage(text);
