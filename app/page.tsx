export default function LandingPage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Client Radar</p>
        <h1>Never lose money because you forgot to follow up.</h1>
        <p>
          Connect Gmail and get a simple daily report of missed client replies, unanswered
          questions, invoice risks, deadlines, and promises that need your attention.
        </p>
        <a className="button" href="/api/auth/google">
          Connect Gmail
        </a>
      </section>
    </main>
  );
}
