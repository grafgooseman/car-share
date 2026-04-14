import type { HeroContent } from '../types';

type HeroPanelProps = {
  carName: string;
  content: HeroContent;
  imageSrc: string;
  riskImageSrc: string;
};

export function HeroPanel({ carName, content, imageSrc, riskImageSrc }: HeroPanelProps) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{carName}</h1>
        <p className="hero-text">{content.description}</p>
        <div className="hero-badges">
          <span>{content.badgePrimary}</span>
          <span>{content.badgeSecondary}</span>
          <span>{content.badgeTertiary}</span>
        </div>
      </div>
      <div className="hero-visual">
        <img
          className="hero-car-image"
          src={imageSrc}
          alt={carName}
          width={960}
          height={340}
          decoding="async"
          fetchPriority="high"
        />
        <div className="risk-note">
          <img
            className="risk-note__image"
            src={riskImageSrc}
            alt="Example of why a risk cost is included"
            width={320}
            height={213}
            loading="lazy"
            decoding="async"
          />
          <div className="risk-note__copy">
            <strong>{content.riskTitle}</strong>
            <p>{content.riskBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
