export default function LandingPage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Radar AI</p>
        <h1>ИИ, который находит в почте и мессенджерах то, что нельзя забыть.</h1>
        <p>
          Radar AI проверяет Telegram, Gmail, Яндекс Почту, Mail.ru и любые вставленные сообщения,
          чтобы найти дедлайны, обещания, оплаты, документы и риски.
        </p>
        <div className="actions">
          <a className="button" href="/telegram">
            Подключить Telegram
          </a>
          <a className="button secondary" href="/email/connect">
            Подключить почту
          </a>
          <a className="button secondary" href="/manual">
            Вставить сообщение
          </a>
        </div>
        <p className="smallLink">
          Gmail OAuth сохранён: <a href="/api/auth/google">подключить Gmail</a>
        </p>
      </section>
    </main>
  );
}
