import Link from "next/link";

export default function StudentHomePage() {
  return (
    <main>
      <section className="hero">
        <h1 className="title">Ethics Labs Learning Studio</h1>
        <p className="subtitle">
          Launch live sessions, track assignments, and monitor classroom engagement from one unified experience.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h3 className="cardTitle">Live Classroom</h3>
          <p>Join by code and sync with teacher pacing.</p>
          <ul className="pillLinkList">
            <li>
              <Link className="pillLink" href="/live">
                Open Live Join
              </Link>
            </li>
          </ul>
        </article>
        <article className="card">
          <h3 className="cardTitle">Data Dashboard</h3>
          <p>Track usage metrics and role-based workflows.</p>
          <ul className="pillLinkList">
            <li>
              <Link className="pillLink" href="/dashboard">
                Open Dashboard
              </Link>
            </li>
          </ul>
        </article>
        <article className="card">
          <h3 className="cardTitle">Assignments</h3>
          <p>See independent tasks and due dates.</p>
          <ul className="pillLinkList">
            <li>
              <Link className="pillLink" href="/assignments">
                View Assignments
              </Link>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
