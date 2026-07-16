import { Link } from "react-router-dom";
import "./HecatePage.css";

function HecatePage() {
  return (
    <div className="hecate-page">
      <main className="hecate-shell">
        <header className="hecate-hero">
          <Link className="hecate-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="hecate-eyebrow">Sister Site</p>
          <h1>Hecate</h1>
          <p className="hecate-subtitle">
            The night-side route for atmospheric, supernatural, and cosmic horror where haunted places, forgotten rituals, ancient evils, and the unknown wait just beyond the veil.
          </p>
        </header>

        <section className="hecate-card" aria-label="Hecate intro">
          <h2>Coming Soon</h2>
          <p>
            Hecate is now a live React route. Next step is shaping its own subgenre map and
            recommendation engine.
          </p>
        </section>
      </main>
    </div>
  );
}

export default HecatePage;
