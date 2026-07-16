import { Link } from "react-router-dom";
import "./NyxPage.css";

function NyxPage() {
  return (
    <div className="hecate-page">
      <main className="hecate-shell">
        <header className="hecate-hero">
          <Link className="hecate-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="hecate-eyebrow">Nyx</p>
          <h1>Nyx</h1>
          <p className="hecate-subtitle">
            A nightmare-lit route for cosmic dread, haunted rituals, and the slow unmaking
            of what should have stayed buried.
          </p>
        </header>

        <section className="hecate-card" aria-label="Nyx intro">
          <h2>Coming Soon</h2>
          <p>
            Nyx is now a live React route. Next step is shaping its own subgenre map and
            recommendation engine.
          </p>
        </section>
      </main>
    </div>
  );
}

export default NyxPage;
