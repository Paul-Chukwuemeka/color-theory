/*
 * In-context mockups: one finished screen per app type.
 *
 * The markup is static per type. Every colour comes from the palette through
 * CSS custom properties, so switching type or base colour repaints the card
 * without rebuilding it.
 *
 * Two markers describe how an element uses the palette:
 *
 *   data-role="X"  the element is painted with role X and is hidden when the
 *                   palette does not have that role. Use it for things that
 *                   exist only to show a colour: chips, dots, bars, badges.
 *   data-text="X"  the element's text is painted with role X, and it is
 *                   hidden when the palette does not have that role.
 *
 * Elements that carry content the mockup needs (an answer row, a note) keep
 * their content and hold their colour in a small child, so a missing role
 * takes the colour away and never the words.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Preview = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TEMPLATES = {
    general: [
      '<div class="mock mock-general">',
      '  <header class="gp-nav">',
      '    <span class="gp-brand"><span class="gp-mark" data-role="accent">A</span><span class="gp-word">Arcadia</span></span>',
      '    <nav class="gp-links"><span>Product</span><span>Solutions</span><span>Pricing</span><span>Docs</span></nav>',
      '    <span class="gp-nav-right"><span class="gp-signin">Sign in</span><span class="gp-nav-cta" data-role="accent">Start free</span></span>',
      '  </header>',
      '  <div class="gp-hero">',
      '    <div class="gp-copy">',
      '      <span class="gp-eyebrow" data-role="accentSoft">New · Palette-aware theming</span>',
      '      <h3 class="gp-title">Ship a design system your team actually uses.</h3>',
      '      <p class="gp-lede">Tokens, components and docs in one place. Change a hue and every surface updates before standup ends.</p>',
      '      <div class="gp-actions">',
      '        <span class="gp-btn" data-role="accent">Get started free</span>',
      '        <span class="gp-btn-quiet">Book a demo <span class="gp-arrow">→</span></span>',
      '      </div>',
      '      <div class="gp-proof">',
      '        <span class="gp-avatars"><i data-role="accent2"></i><i data-role="accentSoft"></i><i data-role="success"></i><i class="gp-avatar-more">+9</i></span>',
      '        <span class="gp-proof-text"><strong>4,200 teams</strong> ship with Arcadia <span class="gp-stars">★★★★★</span></span>',
      '      </div>',
      '    </div>',
      '    <div class="gp-window">',
      '      <div class="gp-window-bar"><span class="gp-dots"><i></i><i></i><i></i></span><span class="gp-url" data-role="surface">app.arcadia.io/team</span></div>',
      '      <div class="gp-window-body">',
      '        <div class="gp-window-head"><strong>Invite your team</strong><span class="gp-seats" data-role="success">3 seats left</span></div>',
      '        <span class="gp-label">Work email</span>',
      '        <div class="gp-input is-focus"><span>ada@acme.com</span><i class="gp-caret"></i></div>',
      '        <p class="gp-error" data-text="danger"><span class="gp-error-dot" data-role="danger"></span>ada@acme.com is already a member</p>',
      '        <div class="gp-window-actions"><span class="gp-btn-sm" data-role="accent">Send invite</span><span class="gp-btn-sm is-disabled">Copy link</span></div>',
      '        <div class="gp-divider"></div>',
      '        <div class="gp-toggle-row"><span>Public access</span><span class="gp-toggle" data-role="accent"><i></i></span></div>',
      '        <div class="gp-toggle-row"><span>Require 2FA</span><span class="gp-toggle is-off"><i></i></span></div>',
      '        <div class="gp-window-foot"><span class="gp-muted">Owners can change this later</span><span class="gp-link" data-text="accent2">Learn more →</span></div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <footer class="gp-foot">',
      '    <span class="gp-status"><i data-role="success"></i>Operational</span>',
      '    <span class="gp-status"><i data-role="warning"></i>EU latency</span>',
      '    <span class="gp-status"><i data-role="danger"></i>1 incident</span>',
      '    <span class="gp-foot-note">SOC 2 Type II · GDPR ready</span>',
      '  </footer>',
      '</div>'
    ].join('\n'),

    dashboard: [
      '<div class="mock mock-dashboard">',
      '  <header class="db-top">',
      '    <span class="db-crumbs"><span class="db-logo" data-role="accent">N</span><strong>Northwind</strong><span class="db-sep">/</span><span class="db-muted">Overview</span></span>',
      '    <span class="db-tools"><span class="db-search" data-role="surface">Search <kbd>⌘K</kbd></span><span class="db-avatar" data-role="accent2">PC</span></span>',
      '  </header>',
      '  <div class="db-titlebar">',
      '    <div><h3>Revenue overview</h3><p class="db-sub">Updated 2 minutes ago · USD</p></div>',
      '    <div class="db-title-actions"><span class="db-range" data-role="accentSoft">Last 30 days ▾</span><span class="db-export" data-role="accent">Export</span></div>',
      '  </div>',
      '  <div class="db-kpis">',
      '    <div class="db-kpi"><span>MRR</span><strong>$48,290</strong><em data-text="success">↑ 12.4%</em></div>',
      '    <div class="db-kpi"><span>Net revenue</span><strong>$41,870</strong><em data-text="success">↑ 8.1%</em></div>',
      '    <div class="db-kpi"><span>Churn</span><strong>1.8%</strong><em data-text="warning">↑ 0.3%</em></div>',
      '    <div class="db-kpi"><span>Trials</span><strong>312</strong><em data-text="danger">↓ 8.1%</em></div>',
      '  </div>',
      '  <div class="db-main">',
      '    <div class="db-chart-card">',
      '      <div class="db-card-head">',
      '        <div class="db-card-title"><strong>Recurring revenue</strong>',
      '          <span class="db-legend"><i data-role="accent"></i>This period <i data-role="accent2"></i>Previous</span>',
      '        </div>',
      '        <span class="db-badge" data-role="success">On track</span>',
      '      </div>',
      '      <svg class="db-chart" viewBox="0 0 520 132" preserveAspectRatio="none" aria-hidden="true">',
      '        <line class="db-grid" x1="0" y1="30" x2="520" y2="30"></line>',
      '        <line class="db-grid" x1="0" y1="70" x2="520" y2="70"></line>',
      '        <line class="db-grid" x1="0" y1="110" x2="520" y2="110"></line>',
      '        <path class="db-prev" d="M0 108 C40 102 58 88 92 92 C126 96 150 78 186 82 C222 86 248 66 284 72 C320 78 348 54 384 60 C420 66 452 46 520 50"></path>',
      '        <path class="db-area" d="M0 104 C36 98 60 82 94 86 C128 90 152 68 188 72 C224 76 250 56 286 60 C322 64 350 38 386 42 C422 46 456 24 520 26 L520 132 L0 132 Z"></path>',
      '        <path class="db-line" d="M0 104 C36 98 60 82 94 86 C128 90 152 68 188 72 C224 76 250 56 286 60 C322 64 350 38 386 42 C422 46 456 24 520 26"></path>',
      '        <circle class="db-dot" cx="386" cy="42" r="4.5"></circle>',
      '      </svg>',
      '      <div class="db-axis"><span>1 Nov</span><span>8 Nov</span><span>15 Nov</span><span>22 Nov</span><span>30 Nov</span></div>',
      '    </div>',
      '    <aside class="db-side">',
      '      <div class="db-side-head"><strong>Revenue mix</strong><span class="db-muted">30d</span></div>',
      '      <div class="db-donut"><span class="db-donut-center"><strong>$41.8k</strong><span>Total</span></span></div>',
      '      <div class="db-mix">',
      '        <span><i data-role="accent"></i>Subscriptions<strong>62%</strong></span>',
      '        <span><i data-role="accent2"></i>Services<strong>24%</strong></span>',
      '        <span><i class="db-mix-rest"></i>Other<strong>14%</strong></span>',
      '      </div>',
      '      <div class="db-alert" data-text="danger"><i data-role="danger"></i>3 failed payments</div>',
      '    </aside>',
      '  </div>',
      '  <div class="db-table">',
      '    <div class="db-tr db-th"><span>Customer</span><span>Plan</span><span>Amount</span><span>Status</span></div>',
      '    <div class="db-tr"><span>Northwind Labs</span><span>Scale</span><span class="db-num">$2,140.00</span><span class="db-pill" data-role="success">Paid</span></div>',
      '    <div class="db-tr"><span>Acme Studios</span><span>Growth</span><span class="db-num">$860.00</span><span class="db-pill" data-role="warning">Pending</span></div>',
      '    <div class="db-tr"><span>Globex</span><span>Starter</span><span class="db-num">$410.00</span><span class="db-pill" data-role="danger">Failed</span></div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    education: [
      '<div class="mock mock-education">',
      '  <header class="ed-top">',
      '    <span class="ed-close">×</span>',
      '    <span class="ed-progress" data-role="surface"><span class="ed-progress-fill" data-role="accent"></span></span>',
      '    <span class="ed-streak" data-role="warning">🔥 7</span>',
      '    <span class="ed-hearts" data-role="danger">♥ 4</span>',
      '  </header>',
      '  <div class="ed-body">',
      '    <div class="ed-meta"><span class="ed-chip" data-role="accentSoft">Biology · Lesson 4 of 12</span><span class="ed-xp">+20 XP</span></div>',
      '    <h3 class="ed-question">Which organ pumps blood around the body?</h3>',
      '    <p class="ed-hint">Choose the best answer.</p>',
      '    <div class="ed-options">',
      '      <div class="ed-option is-right"><span class="ed-key" data-role="success">A</span><span class="ed-label">Heart</span><span class="ed-verdict" data-role="success">Correct</span></div>',
      '      <div class="ed-option is-wrong"><span class="ed-key" data-role="danger">B</span><span class="ed-label">Liver</span><span class="ed-verdict" data-role="danger">Try again</span></div>',
      '      <div class="ed-option"><span class="ed-key is-quiet" data-role="surface">C</span><span class="ed-label">Lung</span></div>',
      '      <div class="ed-option is-muted"><span class="ed-key is-quiet">D</span><span class="ed-label">Kidney</span></div>',
      '    </div>',
      '    <div class="ed-explain"><span class="ed-bulb" data-role="accent2">✦</span><p><strong>Correct answer.</strong> The heart pumps oxygen-rich blood through the body about 100,000 times a day.</p></div>',
      '    <div class="ed-footer"><span class="ed-count">Question 4 of 10 · 2 of 3 correct</span><span class="ed-cta" data-role="accent">Continue →</span></div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    kids: [
      '<div class="mock mock-kids">',
      '  <header class="kd-top">',
      '    <span class="kd-brand"><span class="kd-logo" data-role="accent">S</span><span class="kd-word">Sprout</span></span>',
      '    <span class="kd-right"><span class="kd-stars" data-role="warning">★ 120</span><span class="kd-avatar" data-role="accent2">🦊</span></span>',
      '  </header>',
      '  <div class="kd-stage" data-role="surface">',
      '    <span class="kd-mascot" data-role="accentSoft"><span class="kd-eyes"><i></i><i></i></span><span class="kd-smile"></span></span>',
      '    <h3 class="kd-title">Find the triangle!</h3>',
      '    <p class="kd-hint">Tap the shape with three sides.</p>',
      '    <div class="kd-tiles">',
      '      <span class="kd-tile is-picked" data-role="accent"><span class="kd-shape">▲</span></span>',
      '      <span class="kd-tile" data-role="accent2"><span class="kd-shape">●</span></span>',
      '      <span class="kd-tile is-quiet"><span class="kd-shape">■</span></span>',
      '    </div>',
      '    <div class="kd-progress" data-role="surface">',
      '      <i data-role="success"></i><i data-role="success"></i><i data-role="success"></i><i data-role="success"></i><i class="kd-todo"></i>',
      '    </div>',
      '  </div>',
      '  <footer class="kd-bottom">',
      '    <span class="kd-coach"><span class="kd-coach-dot" data-role="danger"></span>2 lives left</span>',
      '    <span class="kd-play" data-role="accent">Keep playing ▶</span>',
      '  </footer>',
      '</div>'
    ].join('\n'),

    fintech: [
      '<div class="mock mock-fintech">',
      '  <header class="ft-top">',
      '    <span class="ft-brand"><span class="ft-mark" data-role="accent2">◆</span>Northbank</span>',
      '    <span class="ft-right"><span class="ft-bell"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a5 5 0 0 0-5 5v3l-2 3h14l-2-3V9a5 5 0 0 0-5-5Z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg><i data-role="danger"></i></span><span class="ft-avatar" data-role="accentSoft">AO</span></span>',
      '  </header>',
      '  <div class="ft-grid">',
      '    <div class="ft-card" data-role="accent">',
      '      <span class="ft-card-label">Total balance</span>',
      '      <strong class="ft-balance">$12,480.60</strong>',
      '      <span class="ft-card-sub">+$248.10 this month</span>',
      '      <span class="ft-card-foot"><span class="ft-card-num">•••• 4821</span><span class="ft-card-brand">VISA</span></span>',
      '    </div>',
      '    <div class="ft-side">',
      '      <div class="ft-actions">',
      '        <span class="ft-action"><i data-role="accent">↑</i>Send</span>',
      '        <span class="ft-action"><i data-role="accentSoft">↓</i>Request</span>',
      '        <span class="ft-action"><i data-role="accent2">+</i>Top up</span>',
      '        <span class="ft-action"><i class="ft-action-more">⋯</i>More</span>',
      '      </div>',
      '      <div class="ft-spend">',
      '        <span class="ft-donut"><span class="ft-donut-hole"><strong>$695</strong><span>Spent</span></span></span>',
      '        <span class="ft-spend-copy"><strong>November budget</strong><span class="ft-spend-bar"><i data-role="warning"></i></span><span class="ft-muted">$695 of $1,200</span></span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="ft-list">',
      '    <div class="ft-list-head"><strong>Recent activity</strong><span class="ft-link" data-text="accent">See all</span></div>',
      '    <div class="ft-row"><span class="ft-ic" data-role="accentSoft">☕</span><span class="ft-row-main"><strong>Blue Bottle</strong><span>Food & drink</span></span><span class="ft-amount">−$4.50</span><span class="ft-pill" data-role="surface">Cleared</span></div>',
      '    <div class="ft-row"><span class="ft-ic" data-role="success">↓</span><span class="ft-row-main"><strong>Salary</strong><span>Acme Inc.</span></span><span class="ft-amount is-in">+$3,200.00</span><span class="ft-pill" data-role="success">Cleared</span></div>',
      '    <div class="ft-row"><span class="ft-ic" data-role="warning">⌂</span><span class="ft-row-main"><strong>Utilities</strong><span>Direct debit</span></span><span class="ft-amount">−$120.00</span><span class="ft-pill" data-role="warning">Pending</span></div>',
      '    <div class="ft-row"><span class="ft-ic" data-role="danger">!</span><span class="ft-row-main"><strong>Card payment</strong><span>Online · declined</span></span><span class="ft-amount">−$38.00</span><span class="ft-pill" data-role="danger">Failed</span></div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    health: [
      '<div class="mock mock-health">',
      '  <header class="hl-top">',
      '    <div><span class="hl-eyebrow">Tuesday, 11 November</span><h3>Your health</h3></div>',
      '    <span class="hl-avatar" data-role="accentSoft">M</span>',
      '  </header>',
      '  <div class="hl-hero">',
      '    <div class="hl-ring">',
      '      <svg viewBox="0 0 120 120" aria-hidden="true">',
      '        <circle class="hl-ring-track" cx="60" cy="60" r="50"></circle>',
      '        <circle class="hl-ring-fill" cx="60" cy="60" r="50" pathLength="100" stroke-dasharray="82 100"></circle>',
      '      </svg>',
      '      <span class="hl-ring-label"><strong>82</strong><span>Readiness</span></span>',
      '    </div>',
      '    <div class="hl-hero-copy">',
      '      <span class="hl-pill" data-role="success">● In range</span>',
      '      <h4>Resting heart rate</h4>',
      '      <strong class="hl-reading">62 <span>bpm</span></strong>',
      '      <span class="hl-sub">↓ 4 bpm vs last week</span>',
      '    </div>',
      '  </div>',
      '  <div class="hl-tiles">',
      '    <div class="hl-tile"><span class="hl-tile-label">Sleep</span><strong>7h 42m</strong><span class="hl-tile-bar" data-role="accent2"></span><span class="hl-muted">Goal 8h</span></div>',
      '    <div class="hl-tile"><span class="hl-tile-label">Steps</span><strong>8,410</strong><span class="hl-tile-bar" data-role="accent"></span><span class="hl-muted">84% of goal</span></div>',
      '    <div class="hl-tile"><span class="hl-tile-label">HRV</span><strong>48 ms</strong><span class="hl-tile-bar" data-role="success"></span><span class="hl-muted">Above baseline</span></div>',
      '  </div>',
      '  <div class="hl-trend" data-role="surface">',
      '    <div class="hl-trend-head"><strong>Heart rate</strong><span class="hl-muted">Last 7 days</span></div>',
      '    <svg class="hl-chart" viewBox="0 0 520 72" preserveAspectRatio="none" aria-hidden="true">',
      '      <path class="hl-area" d="M0 44 C40 40 60 52 96 46 C132 40 160 22 200 28 C240 34 268 50 304 44 C340 38 372 18 408 24 C444 30 480 40 520 34 L520 72 L0 72 Z"></path>',
      '      <path class="hl-line" d="M0 44 C40 40 60 52 96 46 C132 40 160 22 200 28 C240 34 268 50 304 44 C340 38 372 18 408 24 C444 30 480 40 520 34"></path>',
      '    </svg>',
      '    <div class="hl-axis"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>',
      '  </div>',
      '  <div class="hl-notes">',
      '    <div class="hl-note"><span class="hl-note-icon" data-role="warning">!</span><div><strong>Wind down 30 minutes earlier</strong><p>Your sleep debt is 1h 12m this week.</p></div></div>',
      '    <div class="hl-note is-danger"><span class="hl-note-icon" data-role="danger">◷</span><div><strong>Medication due at 20:00</strong><p>Vitamin D · 1 capsule with food.</p></div></div>',
      '  </div>',
      '  <span class="hl-cta" data-role="accent">Log a workout</span>',
      '</div>'
    ].join('\n'),

    developer: [
      '<div class="mock mock-developer">',
      '  <header class="dv-top">',
      '    <span class="dv-repo"><span class="dv-mark" data-role="accent2">▲</span>acme/web</span>',
      '    <span class="dv-status" data-role="danger">● Build failed</span>',
      '    <span class="dv-branch" data-role="accentSoft">feat/palette</span>',
      '    <span class="dv-avatar" data-role="accent">PC</span>',
      '  </header>',
      '  <div class="dv-deploy" data-role="surface">',
      '    <span class="dv-deploy-main"><strong>a1f9c2b</strong><span>Fix token contrast in dark mode</span><span class="dv-muted">paul · 2 minutes ago</span></span>',
      '    <span class="dv-deploy-actions"><span class="dv-ghost">Redeploy</span><span class="dv-cta" data-role="accent">Visit ↗</span></span>',
      '  </div>',
      '  <div class="dv-body">',
      '    <div class="dv-term">',
      '      <div class="dv-term-bar"><span class="dv-dots"><i></i><i></i><i></i></span><span>build</span><span class="dv-muted">1.2s</span></div>',
      '      <pre class="dv-code"><span class="dv-line"><span class="dv-dim">$ </span><span class="dv-key" data-text="accent2">npm</span> run build</span>',
      '<span class="dv-line" data-text="success">✓ 42 pages built</span>',
      '<span class="dv-line" data-text="warning">! unused variable: theme</span>',
      '<span class="dv-line" data-text="danger">✗ token --color-ghost has no value</span>',
      '<span class="dv-line"><span class="dv-dim">at </span>styles/tokens.css:18:3</span>',
'<span class="dv-line"><span class="dv-dim">→ </span>18 routes compiled</span>',
'<span class="dv-line"><span class="dv-dim">$ </span><i class="dv-cursor"></i></span></pre>',
      '    </div>',
      '    <aside class="dv-side">',
      '      <span class="dv-side-title">Environment</span>',
      '      <div class="dv-env"><span>API_URL</span><span class="dv-tag" data-role="success">set</span></div>',
      '      <div class="dv-env"><span>STRIPE_KEY</span><span class="dv-tag" data-role="warning">missing</span></div>',
      '      <div class="dv-env"><span>JWT_SECRET</span><span class="dv-tag" data-role="danger">invalid</span></div>',
      '      <span class="dv-side-title">Build</span>',
      '      <div class="dv-stat"><span>Duration</span><strong>1.2s</strong></div>',
      '      <div class="dv-stat"><span>Bundle</span><strong>38.4 kB</strong></div>',
      '      <div class="dv-stat"><span>Framework</span><strong>Next 15</strong></div>',
      '    </aside>',
      '  </div>',
      '  <footer class="dv-foot"><span class="dv-dot" data-role="danger"></span><span>Build stopped at the first error</span><span class="dv-link" data-text="accent">View logs →</span></footer>',
      '</div>'
    ].join('\n')
  };

  var ids = Object.keys(TEMPLATES);

  function markup(appType) {
    if (Object.prototype.hasOwnProperty.call(TEMPLATES, appType)) return TEMPLATES[appType];
    return TEMPLATES.general;
  }

  return {
    templates: TEMPLATES,
    ids: ids,
    markup: markup
  };
}));
