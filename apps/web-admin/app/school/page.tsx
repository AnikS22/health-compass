export default function SchoolAdminPage() {
  return (
    <main>
      <section className="hero">
        <h1 className="title">School Admin Dashboard</h1>
        <p className="subtitle">Operational controls for your school tenant.</p>
      </section>
      <ul className="list">
        <li>Manage teacher accounts and rosters</li>
        <li>Enable/disable curriculum units</li>
        <li>View active teacher/student usage trends</li>
        <li>Configure data retention and guest join policy</li>
      </ul>
    </main>
  );
}
