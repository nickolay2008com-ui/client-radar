"use client";

import { FormEvent, useEffect, useState } from "react";

const presets = {
  yandex: { imapHost: "imap.yandex.com", imapPort: "993", imapSecure: true },
  mailru: { imapHost: "imap.mail.ru", imapPort: "993", imapSecure: true },
  gmail_imap: { imapHost: "imap.gmail.com", imapPort: "993", imapSecure: true },
  custom: { imapHost: "", imapPort: "993", imapSecure: true },
};

export default function EmailConnectPage() {
  const [provider, setProvider] = useState<keyof typeof presets>("yandex");
  const [form, setForm] = useState({
    email: "",
    imapHost: presets.yandex.imapHost,
    imapPort: presets.yandex.imapPort,
    imapSecure: presets.yandex.imapSecure,
    username: "",
    appPassword: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const preset = presets[provider];
    setForm((current) => ({ ...current, ...preset }));
  }, [provider]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Сохраняю...");

    const response = await fetch("/api/email/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, provider }),
    });

    setMessage(response.ok ? "Почта подключена. Пароль сохранён в зашифрованном виде." : "Не удалось сохранить подключение.");

    if (response.ok) {
      setForm((current) => ({ ...current, appPassword: "" }));
    }
  }

  return (
    <main className="page pageWide">
      <section className="card">
        <p className="eyebrow">Radar AI</p>
        <h1>Подключить почту</h1>
        <p>Сохраните IMAP-доступ. Пароль приложения шифруется и не показывается после сохранения.</p>
        <form className="form" onSubmit={onSubmit}>
          <input placeholder="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <select value={provider} onChange={(event) => setProvider(event.target.value as keyof typeof presets)}>
            <option value="yandex">Yandex</option>
            <option value="mailru">Mail.ru</option>
            <option value="gmail_imap">Gmail IMAP</option>
            <option value="custom">Custom</option>
          </select>
          <input placeholder="imapHost" value={form.imapHost} onChange={(event) => setForm({ ...form, imapHost: event.target.value })} />
          <input placeholder="imapPort" value={form.imapPort} onChange={(event) => setForm({ ...form, imapPort: event.target.value })} />
          <label className="checkbox">
            <input
              checked={form.imapSecure}
              onChange={(event) => setForm({ ...form, imapSecure: event.target.checked })}
              type="checkbox"
            />
            Secure IMAP
          </label>
          <input placeholder="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          <input
            placeholder="appPassword"
            type="password"
            value={form.appPassword}
            onChange={(event) => setForm({ ...form, appPassword: event.target.value })}
          />
          <button className="button" type="submit">Сохранить подключение</button>
        </form>
        {message ? <p>{message}</p> : null}
      </section>
    </main>
  );
}
