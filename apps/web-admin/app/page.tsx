export default function AdminHomePage() {
  return (
    <main>
      <section className="hero">
        <h1 className="title">Ethics Labs Administration</h1>
        <p className="subtitle">Manage schools, users, curriculum operations, and platform health.</p>
      </section>
      <section className="grid">
        <article className="card">
          <h2 style={{ marginTop: 0 }}>School Admin</h2>
          <ul className="list">
            <li>Users and roster oversight</li>
            <li>Curriculum access and pacing settings</li>
            <li>Usage and completion visibility</li>
            <li>Policy and compliance controls</li>
          </ul>
        </article>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>Ethics Labs Admin</h2>
          <ul className="list">
            <li>Curriculum publishing governance</li>
            <li>School licensing and entitlements</li>
            <li>Global funnel analytics</li>
            <li>Safety, moderation, and audits</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
