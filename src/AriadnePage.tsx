import { Link } from "react-router-dom";
import "./AriadnePage.css";

function AriadnePage() {
  return (
    <div className="ariadne-page">
      <main className="ariadne-shell">
        <header className="ariadne-hero">
          <Link className="ariadne-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="ariadne-eyebrow">Ariadne</p>
          <h1>Ariadne</h1>
          <p className="ariadne-subtitle">
            A threadbound archive of labyrinthine reads where each path reveals one more hidden chamber.
          </p>
        </header>

        <section className="ariadne-card" aria-label="Ariadne intro">
          <h2>Coming Soon</h2>
          <p>
            Ariadne is now a live React route. Next step is building her subgenre map and recommendation engine.
          </p>
        </section>
      </main>
    </div>
  );
}

export default AriadnePage;
