"use client";

import { FormEvent, useState } from "react";

type Signal = {
  id: string;
  type: string;
  priority: string;
  title: string;
  summary: string;
  risk: string | null;
  suggestedAction: string;
  suggestedReply: string | null;
};

export default function ManualPage() {
  const [text, setText] = useState("");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setSignals([]);

    const response = await fetch("/api/manual/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceName: "Manual paste" }),
    });

    const data = (await response.json()) as { signals?: Signal[]; error?: string };
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Не удалось проанализировать сообщение.");
      return;
    }

    setSignals(data.signals ?? []);
  }

  return (
    <main className="page pageWide">
      <section className="card">
        <p className="eyebrow">Radar AI</p>
        <h1>Вставьте сообщение</h1>
        <p>Radar AI найдёт дедлайны, оплаты, обещания, документы и забытые действия.</p>
        <form className="form" onSubmit={onSubmit}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Вставьте письмо, сообщение из Telegram, WhatsApp, VK или Avito..."
            rows={10}
          />
          <button className="button" disabled={isLoading || !text.trim()} type="submit">
            {isLoading ? "Анализирую..." : "Analyze message"}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        <div className="results">
          {signals.length === 0 && !isLoading ? <p>Пока нет найденных сигналов.</p> : null}
          {signals.map((signal) => (
            <article className="signal" key={signal.id}>
              <strong>[{signal.priority}] {signal.title}</strong>
              <span>Тип: {signal.type}</span>
              <p>{signal.summary}</p>
              {signal.risk ? <p>Риск: {signal.risk}</p> : null}
              <p>Что сделать: {signal.suggestedAction}</p>
              {signal.suggestedReply ? <p>Готовый ответ: {signal.suggestedReply}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
