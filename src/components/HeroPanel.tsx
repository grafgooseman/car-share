import type { HeroContent } from '../types';

type HeroPanelProps = {
  carName?: string;
  content?: HeroContent;
  imageSrc: string;
  riskImageSrc: string;
  isLoading: boolean;
  isError: boolean;
};

export function HeroPanel({ carName, content, imageSrc, riskImageSrc, isLoading, isError }: HeroPanelProps) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        {isLoading ? (
          <>
            <span className="skeleton skeleton-line skeleton-line--eyebrow" data-testid="hero-skeleton-eyebrow" />
            <h1>
              <span className="skeleton skeleton-line skeleton-line--hero-title" data-testid="hero-skeleton-title" />
            </h1>
            <div className="hero-text hero-text--skeleton" data-testid="hero-skeleton-copy">
              <span className="skeleton skeleton-line skeleton-line--hero-copy" />
              <span className="skeleton skeleton-line skeleton-line--hero-copy skeleton-line--short" />
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">{content?.eyebrow}</p>
            <h1>{carName}</h1>
            <p className="hero-text">{content?.description}</p>
          </>
        )}
        {isLoading ? (
          <p className="status-pill status-pill--hero">Connecting to Supabase for live trip settings</p>
        ) : null}
        {isError ? (
          <p className="inline-banner inline-banner--hero">
            Trip settings could not be loaded. The calculator shell stays visible, but live values are paused.
          </p>
        ) : null}
        <div className="hero-badges">
          {isLoading ? (
            <>
              <span className="skeleton skeleton-pill" />
              <span className="skeleton skeleton-pill" />
              <span className="skeleton skeleton-pill" />
            </>
          ) : (
            <>
              <span>{content?.badgePrimary}</span>
              <span>{content?.badgeSecondary}</span>
              <span>{content?.badgeTertiary}</span>
            </>
          )}
        </div>
      </div>
      <div className="hero-visual">
        <img
          className="hero-car-image"
          src={imageSrc}
          alt={carName ?? 'Car illustration'}
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
            {isLoading ? (
              <>
                <span className="skeleton skeleton-line skeleton-line--risk-title" />
                <div className="risk-note__text-skeleton">
                  <span className="skeleton skeleton-line skeleton-line--risk-body" />
                  <span className="skeleton skeleton-line skeleton-line--risk-body skeleton-line--short" />
                </div>
              </>
            ) : (
              <>
                <strong>{content?.riskTitle}</strong>
                <p>{content?.riskBody}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
