"use client";

import "./landing.css";

/**
 * Nexora SalonoS marketing landing page.
 *
 * This is the brand home shown after the splash for signed-out visitors. It
 * links into the real Nexora app: Get Started → signup, Login → login, and
 * the header nav routes to the marketplace / customer portal.
 */
function go(path: string) {
  window.location.href = path;
}

export function LandingPage() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="l-header">
        <div className="l-container l-header-inner">
          <button
            className="l-brand"
            type="button"
            onClick={() => go("/")}
            aria-label="Nexora SalonoS home"
          >
            <img
              alt="Nexora Logo"
              src="https://lh3.googleusercontent.com/aida/AP1WRLtqTPzYh6UCvgfK6hCXNe22vLSvfEmV4ZbqCYd3tGFnKBJoTEAsixKq2udfvDQu0c2hsAgVmS7VMvKn9rD0-Q12Ofi04-TYPfZ9Zjw0xalx_uEPcNLeKUMnqLc1kqZGiwmWtkz1ELAcFfMPRd6lyr4uidnTP_v_6r4hs7jPtz2T_jymmHuYbCHE3rzGhHV2nOkjVVP2bj5UDgI_X71EsgN4iyb3r10GrsDRXD74Xxpdpnbwn6WkBMpW_yhsMxvblq3HNBdDy5eVLg"
            />
            <span className="l-brand-name">Nexora SalonoS</span>
          </button>
          <nav data-active-classes="text-primary font-bold">
            <button type="button" data-path="explore" onClick={() => go("/salons")}>
              Explore
            </button>
            <button type="button" data-path="services" onClick={() => go("/salons")}>
              Services
            </button>
            <button type="button" data-path="concierge" onClick={() => go("/app/customer")}>
              Concierge
            </button>
          </nav>
          <div className="l-avatar" title="Account">
            <span className="material-symbols-outlined" aria-hidden="true">
              person
            </span>
          </div>
        </div>
      </header>

      <main className="l-hero">
        <div className="l-hero-blob-a" aria-hidden="true" />
        <div className="l-hero-blob-b" aria-hidden="true" />

        <div className="l-container">
          <div className="l-hero-inner">
            <div className="l-hero-grid">
              {/* Copy */}
              <div className="l-hero-copy">
                <div className="l-fade-up">
                  <img
                    alt="Nexora Logo"
                    className="l-copy-logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTXSM1uXL6IZPG2d5vJrZHTp3meZp3ugCNqDfmM7XSBsqTiBEoB65raTIgfM87Q2-Nycckxt2jvImXTu8qIEq3irPWeRIpQcZNxA4R0JaTlBwKqvBvcc-Go9UAWl5bVcwWmbbqlBTIK2-NJT9uA6x1Y3iGKNV8Fot_Z4oI5bt0ftITdQR9jr2ggS1Gi8h5RWL06dUsqs_AdG7E2j9RVLMYR7_A2uBY63Kav7vuNUajTreWXFazOVDuCuv5FTdEwPxqmoM"
                  />
                </div>
                <div className="l-badge-pill l-fade-up l-fade-up-d1">
                  Welcome to Nexora SalonoS
                </div>
                <h1 className="l-fade-up l-fade-up-d2">
                  Jaipur Ki Beauty Industry, <br />
                  <span className="l-accent">Ab Ek Smart Network Par</span>
                </h1>
                <p className="l-intro l-fade-up l-fade-up-d3">
                  Salon book karein, business grow karein, jobs paayein aur
                  apne brand ko promote karein. Experiencing the future of
                  beauty networking today.
                </p>

                <div className="l-hero-actions l-fade-up l-fade-up-d4">
                  <button
                    type="button"
                    className="l-btn-get-started"
                    onClick={() => go("/auth/signup")}
                  >
                    <span className="l-shine" aria-hidden="true" />
                    <span className="l-label">Get Started</span>
                  </button>
                  <button type="button" className="l-btn-login" onClick={() => go("/auth/login")}>
                    Login
                  </button>
                </div>

                <div className="l-stats l-fade-up l-fade-up-d5">
                  <div className="l-stat">
                    <span className="l-stat-num">25k+</span>
                    <span className="l-stat-label">Active Salons</span>
                  </div>
                  <span className="l-stat-divider" aria-hidden="true" />
                  <div className="l-stat">
                    <span className="l-stat-num">1.2M</span>
                    <span className="l-stat-label">Appointments</span>
                  </div>
                  <span className="l-stat-divider l-hide-sm" aria-hidden="true" />
                  <div className="l-stat l-hide-sm-flex">
                    <span className="l-stat-num">4.9</span>
                    <span className="l-stat-label">User Rating</span>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="l-hero-media l-fade-scale">
                <div className="l-media-back-a" aria-hidden="true" />
                <div className="l-media-back-b" aria-hidden="true" />
                <div className="l-media-card">
                  <div
                    className="l-media-bg"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida/AP1WRLuZJGt2jU-aVd8g9Bx6JZT2TilncGqAQMAyueOmggwdsR0-md5_cgcmFZRzdb0OMUIWFhwAwEVmuAhnYDVTbCOaH6H8spZH7K-NrD8l3bpf_V3_mGYWYLMjSKgX-4G3rC6qAG3IeRvY8fXL4hBGlJqDfUJvl77VOOBNpp8ZlrB596kQJeFl3-4o1ZCEYdw9Y37jKWuaHgwAm5ihppW9hQCp0174FbpfV_HU1DL3UN2GeZfBzGYoIMxCJfRs')",
                    }}
                    role="img"
                    aria-label="Nexora salon experience"
                  />
                  <div className="l-media-overlay" aria-hidden="true" />
                  <div className="l-media-footer">
                    <div className="l-live-card">
                      <div className="l-live-head">
                        <span className="l-live-dot" aria-hidden="true" />
                        <span className="l-live-title">Live Activity</span>
                      </div>
                      <p className="l-live-text">
                        <strong>Priya M.</strong> just booked a consultation.
                      </p>
                    </div>
                    <div className="l-spa-circle" aria-hidden="true">
                      <span className="material-symbols-outlined">spa</span>
                    </div>
                  </div>
                </div>
                <div className="l-growth-card">
                  <div className="l-growth-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">
                      trending_up
                    </span>
                  </div>
                  <div>
                    <p className="l-growth-label">Growth Rate</p>
                    <p className="l-growth-value">+34% this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="l-footer">
        <div className="l-container l-footer-inner">
          <img
            alt="Nexora Logo"
            src="https://lh3.googleusercontent.com/aida/AP1WRLtqTPzYh6UCvgfK6hCXNe22vLSvfEmV4ZbqCYd3tGFnKBJoTEAsixKq2udfvDQu0c2hsAgVmS7VMvKn9rD0-Q12Ofi04-TYPfZ9Zjw0xalx_uEPcNLeKUMnqLc1kqZGiwmWtkz1ELAcFfMPRd6lyr4uidnTP_v_6r4hs7jPtz2T_jymmHuYbCHE3rzGhHV2nOkjVVP2bj5UDgI_X71EsgN4iyb3r10GrsDRXD74Xxpdpnbwn6WkBMpW_yhsMxvblq3HNBdDy5eVLg"
          />
          <div className="l-copyright">
            © 2024 Nexora Digital Beauty. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
