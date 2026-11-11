/*
 * In-context mockups: one screen per app type.
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
      '  <div class="mock-nav">',
      '    <span class="mock-brand"><span class="mock-logo" data-role="accent"></span><span class="mock-wordmark">Acme</span></span>',
      '    <span class="mock-links"><i></i><i></i><i></i></span>',
      '    <span class="mock-avatar" data-role="accent2"></span>',
      '  </div>',
      '  <div class="mock-grid">',
      '    <div class="mock-copy">',
      '      <span class="mock-eyebrow">Palette in context</span>',
      '      <h3 class="mock-heading">Ship something beautiful</h3>',
      '      <p class="mock-text">Every color you see here comes from your scheme — the ones listed in the palette above.</p>',
      '      <div class="mock-actions">',
      '        <span class="mock-button" data-role="accent">Get started</span>',
      '        <span class="mock-button" data-role="accentSoft">See details</span>',
      '      </div>',
      '      <div class="mock-tags">',
      '        <span class="mock-tag" data-role="accentSoft">accent-soft</span>',
      '        <span class="mock-tag" data-role="surface">surface</span>',
      '      </div>',
      '    </div>',
      '    <div class="mock-panel">',
      '      <div class="mock-panel-head">',
      '        <span class="mock-panel-title">This week</span>',
      '        <span class="mock-badge" data-role="accentSoft">+18%</span>',
      '      </div>',
      '      <div class="mock-bars">',
      '        <i style="height:40%"></i><i style="height:58%"></i><i style="height:46%"></i><i style="height:72%"></i>',
      '        <i style="height:54%"></i><i class="is-alt" data-role="accent2" style="height:100%"></i><i style="height:66%"></i>',
      '      </div>',
      '      <div class="mock-stats">',
      '        <div><strong>2.4k</strong><span>Users</span></div>',
      '        <div><strong>98%</strong><span>Uptime</span></div>',
      '      </div>',
      '      <div class="mock-states">',
      '        <span class="mock-state" data-role="success">Success</span>',
      '        <span class="mock-state" data-role="warning">Warning</span>',
      '        <span class="mock-state" data-role="danger">Error</span>',
      '      </div>',
      '      <div class="mock-states">',
      '        <span class="mock-state is-hover" data-role="accent">Hover</span>',
      '        <span class="mock-state is-disabled" data-role="surface">Disabled</span>',
      '        <span class="mock-state is-focus" data-role="accent2">Focus</span>',
      '        <span class="mock-input is-error">you@example</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    dashboard: [
      '<div class="mock mock-dashboard">',
      '  <div class="mock-head">',
      '    <div>',
      '      <span class="mock-eyebrow">This month</span>',
      '      <h3 class="mock-heading">Revenue</h3>',
      '    </div>',
      '    <span class="mock-button" data-role="accent">Export</span>',
      '  </div>',
      '  <div class="mock-kpis">',
      '    <div class="mock-kpi">',
      '      <span class="mock-kpi-label">MRR</span>',
      '      <strong class="mock-kpi-value">$48.2k</strong>',
      '      <span class="mock-delta" data-role="success">+12.4%</span>',
      '    </div>',
      '    <div class="mock-kpi">',
      '      <span class="mock-kpi-label">Churn</span>',
      '      <strong class="mock-kpi-value">1.8%</strong>',
      '      <span class="mock-delta" data-role="warning">+0.3%</span>',
      '    </div>',
      '    <div class="mock-kpi">',
      '      <span class="mock-kpi-label">Trials</span>',
      '      <strong class="mock-kpi-value">312</strong>',
      '      <span class="mock-delta" data-role="danger">-8.1%</span>',
      '    </div>',
      '  </div>',
      '  <div class="mock-panel">',
      '    <div class="mock-panel-head">',
      '      <span class="mock-panel-title">Signups</span>',
      '      <span class="mock-badge" data-role="accentSoft">Last 7 days</span>',
      '      <span class="mock-badge" data-role="surface">vs last week</span>',
      '    </div>',
      '    <div class="mock-bars">',
      '      <i style="height:38%"></i><i style="height:52%"></i><i style="height:44%"></i><i style="height:61%"></i>',
      '      <i class="is-alt" data-role="accent2" style="height:86%"></i><i style="height:58%"></i><i style="height:74%"></i>',
      '    </div>',
      '  </div>',
      '  <div class="mock-rows">',
      '    <div class="mock-row"><span>Northwind</span><span class="mock-row-value">$2,140</span><span class="mock-pill" data-role="success">Paid</span></div>',
      '    <div class="mock-row"><span>Acme Labs</span><span class="mock-row-value">$860</span><span class="mock-pill" data-role="warning">Pending</span></div>',
      '    <div class="mock-row"><span>Globex</span><span class="mock-row-value">$410</span><span class="mock-pill" data-role="danger">Failed</span></div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    education: [
      '<div class="mock mock-education">',
      '  <div class="mock-panel">',
      '    <div class="mock-head">',
      '      <span class="mock-eyebrow">Biology · Chapter 4</span>',
      '      <span class="mock-badge" data-role="warning">7 day streak</span>',
      '    </div>',
      '    <h3 class="mock-heading">Which organ pumps blood around the body?</h3>',
      '    <div class="mock-pills">',
      '      <span class="mock-pill is-active" data-role="accent">Biology</span>',
      '      <span class="mock-pill">Chemistry</span>',
      '      <span class="mock-pill">Physics</span>',
      '    </div>',
      '    <div class="mock-track" data-role="surface"><span class="mock-track-fill" data-role="accent"></span></div>',
      '    <div class="mock-answers">',
      '      <div class="mock-answer"><span>Heart</span><span class="mock-tag" data-role="success">Correct</span></div>',
      '      <div class="mock-answer"><span>Liver</span><span class="mock-tag" data-role="danger">Try again</span></div>',
      '      <div class="mock-answer"><span>Lung</span></div>',
      '    </div>',
      '    <div class="mock-actions">',
      '      <span class="mock-button" data-role="accent">Check answer</span>',
      '      <span class="mock-button" data-role="accent2">Need a hint</span>',
      '      <span class="mock-tag" data-role="accentSoft">2 marks</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    kids: [
      '<div class="mock mock-kids">',
      '  <div class="mock-head">',
      '    <span class="mock-mascot" data-role="accentSoft"></span>',
      '    <span class="mock-stars" data-role="warning">★ 12</span>',
      '  </div>',
      '  <h3 class="mock-heading">Ready to play?</h3>',
      '  <p class="mock-text">Pick a shape, then find the one that matches.</p>',
      '  <div class="mock-shapes">',
      '    <span class="mock-shape" data-role="accent">●</span>',
      '    <span class="mock-shape" data-role="accent2">▲</span>',
      '    <span class="mock-shape" data-role="surface">■</span>',
      '  </div>',
      '  <div class="mock-actions">',
      '    <span class="mock-button is-big" data-role="accent">Start</span>',
      '    <span class="mock-button is-round" data-role="accent2">?</span>',
      '  </div>',
      '  <div class="mock-dots">',
      '    <span class="mock-dot" data-role="success"></span>',
      '    <span class="mock-dot" data-role="success"></span>',
      '    <span class="mock-dot" data-role="surface"></span>',
      '    <span class="mock-dot" data-role="surface"></span>',
      '    <span class="mock-dot" data-role="warning"></span>',
      '    <span class="mock-dot" data-role="danger"></span>',
      '  </div>',
      '</div>'
    ].join('\n'),

    fintech: [
      '<div class="mock mock-fintech">',
      '  <div class="mock-balance">',
      '    <span class="mock-eyebrow">Total balance</span>',
      '    <strong class="mock-amount">$12,480.60</strong>',
      '    <span class="mock-delta" data-role="success">+2.1% today</span>',
      '    <span class="mock-cardgraphic" data-role="accent2"></span>',
      '  </div>',
      '  <div class="mock-actions">',
      '    <span class="mock-button" data-role="accent">Pay</span>',
      '    <span class="mock-button" data-role="accentSoft">Transfer</span>',
      '  </div>',
      '  <div class="mock-rows">',
      '    <div class="mock-row"><span>Coffee</span><span class="mock-row-value">-4.50</span><span class="mock-pill" data-role="surface">Food</span></div>',
      '    <div class="mock-row"><span>Salary</span><span class="mock-row-value">+3,200</span><span class="mock-pill" data-role="success">Cleared</span></div>',
      '    <div class="mock-row"><span>Utilities</span><span class="mock-row-value">-120</span><span class="mock-pill" data-role="warning">Pending</span></div>',
      '    <div class="mock-row"><span>Card payment</span><span class="mock-row-value">-38.00</span><span class="mock-pill" data-role="danger">Declined</span></div>',
      '  </div>',
      '</div>'
    ].join('\n'),

    health: [
      '<div class="mock mock-health">',
      '  <div class="mock-head">',
      '    <span class="mock-eyebrow">Resting heart rate</span>',
      '    <span class="mock-pill" data-role="accent2">Last night</span>',
      '  </div>',
      '  <strong class="mock-reading">62 bpm</strong>',
      '  <div class="mock-range" data-role="accentSoft"><span class="mock-range-fill" data-role="accent"></span></div>',
      '  <div class="mock-chips">',
      '    <span class="mock-pill" data-role="success">In range</span>',
      '    <span class="mock-pill" data-role="surface">Goal 60 bpm</span>',
      '  </div>',
      '  <div class="mock-note"><span class="mock-note-dot" data-role="warning"></span>Try twenty more minutes of sleep tonight.</div>',
      '  <div class="mock-rows">',
      '    <div class="mock-row"><span>08:00</span><span class="mock-row-value">Morning walk</span></div>',
      '    <div class="mock-row"><span>13:30</span><span class="mock-row-value">Check-in</span></div>',
      '  </div>',
      '  <div class="mock-note"><span class="mock-note-dot" data-role="danger"></span>Medication due at 20:00.</div>',
      '  <span class="mock-button" data-role="accent">Book appointment</span>',
      '</div>'
    ].join('\n'),

    developer: [
      '<div class="mock mock-developer">',
      '  <div class="mock-head">',
      '    <span class="mock-window-dots"><i></i><i></i><i></i></span>',
      '    <span class="mock-branch" data-role="accentSoft">feat/palette</span>',
      '    <span class="mock-pill" data-role="surface">node 20</span>',
      '  </div>',
      '  <pre class="mock-code"><code><span class="mock-line"><span class="c-dim">$ </span><span class="c-key" data-text="accent2">npm</span> <span class="c-text">run build</span></span>',
      '<span class="mock-line" data-text="success">✓ built in 1.2s</span>',
      '<span class="mock-line" data-text="warning">! 1 warning: unused variable</span>',
      '<span class="mock-line" data-text="danger">✗ 1 error: accent2 is not a role</span>',
      '</code></pre>',
      '  <span class="mock-button" data-role="accent">Deploy</span>',
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
