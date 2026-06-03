export default function SuccessPage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Client Radar</p>
        <h1>Gmail connected successfully.</h1>
        <p>Run your first report to find client follow-ups and risks from recent Gmail threads.</p>
        <a className="button" href="/api/report/run">
          Run first report
        </a>
      </section>
    </main>
  );
}
