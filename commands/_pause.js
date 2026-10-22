/*CMD
  command: /pause
  help: إيقاف أو استئناف النشر التلقائي
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: ⏸ إيقاف / استئناف, إيقاف
CMD*/

var p = Bot.getProperty("is_paused");
var new_p = !p;
Bot.setProperty("is_paused", new_p, "boolean");
var msg = new_p ? "⏸ تم إيقاف النشر مؤقتاً." : "▶️ تم استئناف النشر التلقائي بنجاح!";
Bot.sendMessage(msg);
