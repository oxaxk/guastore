import './StaticPage.css';

export default function About() {
  return (
    <div className="static-page">
      <div className="container">
        <h1>Über GUA SHOP</h1>
        <p className="lead">GUA SHOP steht für kuratierte Premium Gua Sha Tools, moderne Selfcare-Rituale und eine ruhige, hochwertige Alternative zum klassischen Beauty-Shop.</p>
        <div className="content-block">
          <h2>Unsere Mission</h2>
          <p>
            GUA SHOP wurde gegründet, um Gua Sha neu zu denken: reduzierter, klarer und hochwertiger. Statt eines
            überladenen Beauty-Shops fokussieren wir uns auf kuratierte Tools, bewusste Anwendung und ein modernes Ritual,
            das sich wirklich gut anfühlt.
          </p>
          <p>
            Unser Fokus liegt auf wenigen, starken Produkten mit echtem Charakter – aktuell mit The Steel und Xiu Jade,
            ergänzt durch The Rose als kommende Preview.
          </p>
        </div>
        <div className="content-block">
          <h2>Wofür wir stehen</h2>
          <ul>
            <li><strong>Kuratierung statt Überladung:</strong> Weniger Produkte, klarere Entscheidungen, stärkerer Fokus.</li>
            <li><strong>Material mit Bedeutung:</strong> Edelstahl, Xiu Jade und ausgewählte Materialien mit bewusstem Hautgefühl.</li>
            <li><strong>Modernes Ritual:</strong> Selfcare ohne Kitsch – reduziert, clean und alltagstauglich.</li>
            <li><strong>Premium-Ästhetik:</strong> Editorial statt überladen, ruhig statt laut, hochwertig statt beliebig.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
