export default function TelegramPage() {
  return (
    <main className="page pageWide">
      <section className="card">
        <p className="eyebrow">Radar AI</p>
        <h1>Подключить Telegram</h1>
        <p>
          Укажите Telegram webhook на адрес /api/telegram/webhook и задайте TELEGRAM_BOT_TOKEN.
          Если задан TELEGRAM_WEBHOOK_SECRET, передавайте его в заголовке Telegram secret token.
        </p>
      </section>
    </main>
  );
}
