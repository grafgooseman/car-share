type HeroPanelProps = {
  carName: string;
  imageSrc: string;
  riskImageSrc: string;
};

export function HeroPanel({ carName, imageSrc, riskImageSrc }: HeroPanelProps) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Trip Cost Splitter</p>
        <h1>{carName}</h1>
        <p className="hero-text">
          A clean way to calculate who owes what for a trip using the same cost logic as the
          original spreadsheet.
        </p>
        <div className="hero-badges">
          <span>Fuel + insurance + wear</span>
          <span>Parking included</span>
          <span>Rounded up fairly</span>
        </div>
      </div>
      <div className="hero-visual">
        <img className="hero-car-image" src={imageSrc} alt={carName} />
        <div className="risk-note">
          <img src={riskImageSrc} alt="Example of why a risk cost is included" />
          <div>
            <strong>Risk coverage matters</strong>
            <p>Small damage, towing, and cleanup are already built into the cost per km.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
