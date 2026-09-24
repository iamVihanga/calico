/* @ds-bundle: {"format":4,"namespace":"CalicoDesignSystem_3b5126","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Sheet","sourcePath":"components/feedback/Sheet.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"ScreenHeader","sourcePath":"components/navigation/ScreenHeader.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"ActivityRow","sourcePath":"components/reading/ActivityRow.jsx"},{"name":"BookCard","sourcePath":"components/reading/BookCard.jsx"},{"name":"BookCover","sourcePath":"components/reading/BookCover.jsx"},{"name":"ProgressBar","sourcePath":"components/reading/ProgressBar.jsx"},{"name":"QuoteCard","sourcePath":"components/reading/QuoteCard.jsx"},{"name":"StreakRing","sourcePath":"components/reading/StreakRing.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"ad6091d2a11d","components/core/Badge.jsx":"c1343f92adc1","components/core/Button.jsx":"13a829d34109","components/core/Card.jsx":"e6f2fb83504c","components/core/IconButton.jsx":"3ce415bc203b","components/core/Tag.jsx":"5abc5453fc30","components/feedback/EmptyState.jsx":"8272792ef6e9","components/feedback/Sheet.jsx":"0bfc5cfcbf6e","components/feedback/Toast.jsx":"51ded6484421","components/forms/Checkbox.jsx":"2f79571da964","components/forms/Input.jsx":"8b68115b7ec6","components/forms/SearchField.jsx":"3919a129023f","components/forms/Select.jsx":"59a252c1b2ee","components/forms/Switch.jsx":"765139e8e11d","components/navigation/ScreenHeader.jsx":"8e614ea51f47","components/navigation/SegmentedControl.jsx":"001deb40dc67","components/navigation/TabBar.jsx":"97cdbef12064","components/reading/ActivityRow.jsx":"28f24bd15db0","components/reading/BookCard.jsx":"b663cbd39c96","components/reading/BookCover.jsx":"ba211e1034b0","components/reading/ProgressBar.jsx":"69364a52112d","components/reading/QuoteCard.jsx":"836aef7d4bac","components/reading/StreakRing.jsx":"311fd10e513a","ui_kits/calico-app/App.jsx":"9438f034db5c","ui_kits/calico-app/BookDetailScreen.jsx":"9527298ca425","ui_kits/calico-app/FriendsScreen.jsx":"a5c42c790e11","ui_kits/calico-app/HomeScreen.jsx":"19f44e518888","ui_kits/calico-app/Icons.jsx":"d56640d697db","ui_kits/calico-app/LibraryScreen.jsx":"bfd58f2a4b35","ui_kits/calico-app/OnboardingScreen.jsx":"7f8dc24953ab","ui_kits/calico-app/PhoneFrame.jsx":"748f9ca2bc79","ui_kits/calico-app/ReaderScreen.jsx":"8ee5b0ba285a","ui_kits/calico-app/data.js":"b32f8216eef5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CalicoDesignSystem_3b5126 = window.CalicoDesignSystem_3b5126 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const dims = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72
};
const ringTones = {
  none: 'transparent',
  accent: 'var(--accent-primary)',
  forest: 'var(--accent-tertiary)',
  pink: 'var(--accent-pink)',
  honey: 'var(--accent-secondary)'
};
function Avatar({
  name = '',
  src,
  size = 'md',
  ring = 'none',
  tone = 'sand',
  style,
  ...rest
}) {
  const d = dims[size];
  const bg = {
    sand: 'var(--calico-biscuit)',
    pink: 'var(--calico-petal)',
    forest: 'var(--calico-fern)',
    honey: 'var(--calico-honeycomb)'
  }[tone] || tone;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: ring === 'none' ? 0 : 2,
      background: ringTones[ring],
      borderRadius: 'var(--radius-pill)',
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: d,
      height: d,
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden',
      background: bg,
      display: 'grid',
      placeItems: 'center',
      border: '2px solid var(--surface-card)',
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--weight-bold)',
      fontSize: Math.round(d * .38),
      color: 'var(--calico-espresso)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  accent: {
    background: 'var(--surface-accent-soft)',
    color: '#8A3708'
  },
  forest: {
    background: 'var(--status-success-soft)',
    color: 'var(--status-success)'
  },
  sand: {
    background: 'var(--surface-quiet)',
    color: 'var(--text-secondary)'
  },
  pink: {
    background: 'var(--calico-blush)',
    color: '#A1495A'
  },
  honey: {
    background: 'var(--status-warning-soft)',
    color: '#8A5A12'
  },
  ink: {
    background: 'var(--surface-ink)',
    color: 'var(--text-inverse)'
  }
};
function Badge({
  children,
  tone = 'sand',
  icon,
  caps = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 10px',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-3xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: caps ? 'var(--tracking-caps)' : '.01em',
      textTransform: caps ? 'uppercase' : 'none',
      lineHeight: 1.2,
      ...tones[tone],
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-3)',
  fontFamily: 'var(--font-ui)',
  fontWeight: 'var(--weight-bold)',
  letterSpacing: '.01em',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textDecoration: 'none',
  minHeight: 'var(--hit-min)',
  boxSizing: 'border-box',
  transition: 'transform var(--duration-fast) var(--ease-cozy), background var(--duration-fast) var(--ease-cozy), box-shadow var(--duration-fast) var(--ease-cozy), color var(--duration-fast) var(--ease-cozy)'
};
const sizes = {
  sm: {
    fontSize: 'var(--size-2xs)',
    padding: '9px 14px',
    minHeight: '36px',
    borderRadius: 'var(--radius-sm)'
  },
  md: {
    fontSize: 'var(--size-sm)',
    padding: 'var(--pad-control-y) var(--pad-control-x)'
  },
  lg: {
    fontSize: 'var(--size-md)',
    padding: '18px 26px',
    borderRadius: 'var(--radius-lg)'
  }
};
const variants = {
  primary: {
    background: 'var(--surface-ink)',
    color: 'var(--text-inverse)',
    boxShadow: 'var(--shadow-sm)'
  },
  accent: {
    background: 'var(--accent-primary)',
    color: 'var(--text-on-accent)',
    boxShadow: 'var(--shadow-sm)'
  },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-strong)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)'
  },
  inverse: {
    background: 'var(--calico-cream)',
    color: 'var(--calico-forest)'
  }
};
const hovers = {
  primary: {
    background: 'var(--calico-espresso)'
  },
  accent: {
    background: 'var(--accent-primary-press)'
  },
  secondary: {
    background: 'var(--surface-page-warm)'
  },
  ghost: {
    background: 'var(--surface-quiet)',
    color: 'var(--text-primary)'
  },
  inverse: {
    background: 'var(--calico-white)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  hand = false,
  block = false,
  icon,
  iconAfter,
  disabled = false,
  href,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const Tag = href ? 'a' : 'button';
  const css = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(hover && !disabled ? hovers[variant] : null),
    ...(hand ? {
      fontFamily: 'var(--font-hand)',
      fontSize: size === 'lg' ? 'var(--size-2xl)' : 'var(--size-xl)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: '.01em'
    } : null),
    ...(block ? {
      width: '100%'
    } : null),
    ...(press && !disabled ? {
      transform: 'scale(var(--press-scale))',
      boxShadow: 'var(--shadow-press)'
    } : null),
    ...(disabled ? {
      opacity: .42,
      cursor: 'not-allowed',
      boxShadow: 'none'
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onClick: disabled ? undefined : onClick,
    disabled: href ? undefined : disabled,
    style: css,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false)
  }, rest), icon, /*#__PURE__*/React.createElement("span", null, children), iconAfter);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  paper: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-soft)'
  },
  warm: {
    background: 'var(--surface-page-warm)',
    color: 'var(--text-primary)',
    border: '1px solid transparent'
  },
  quiet: {
    background: 'var(--surface-quiet)',
    color: 'var(--text-primary)',
    border: '1px solid transparent'
  },
  forest: {
    background: 'var(--surface-inverse)',
    color: 'var(--text-inverse)',
    border: '1px solid transparent'
  },
  accent: {
    background: 'var(--accent-primary)',
    color: 'var(--text-on-accent)',
    border: '1px solid transparent'
  },
  ink: {
    background: 'var(--surface-ink)',
    color: 'var(--text-inverse)',
    border: '1px solid transparent'
  }
};
function Card({
  children,
  tone = 'paper',
  radius = 'lg',
  shadow = 'sm',
  pad = 'md',
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const pads = {
    none: 0,
    sm: 'var(--space-4)',
    md: 'var(--pad-card)',
    lg: 'var(--pad-card-lg)',
    xl: 'var(--space-7)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: 'var(--radius-' + radius + ')',
      padding: pads[pad],
      boxShadow: shadow === 'none' ? 'none' : 'var(--shadow-' + shadow + ')',
      transition: 'transform var(--duration-base) var(--ease-cozy), box-shadow var(--duration-base) var(--ease-cozy)',
      ...tones[tone],
      ...(onClick ? {
        cursor: 'pointer'
      } : null),
      ...(onClick && hover ? {
        transform: 'translateY(var(--lift-hover))',
        boxShadow: 'var(--shadow-md)'
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  quiet: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    hover: {
      background: 'var(--surface-quiet)',
      color: 'var(--text-primary)'
    }
  },
  card: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-soft)',
    hover: {
      background: 'var(--surface-page-warm)'
    }
  },
  accent: {
    background: 'var(--accent-primary)',
    color: 'var(--text-on-accent)',
    hover: {
      background: 'var(--accent-primary-press)'
    }
  },
  ink: {
    background: 'var(--surface-ink)',
    color: 'var(--text-inverse)',
    hover: {
      background: 'var(--calico-espresso)'
    }
  },
  inverse: {
    background: 'var(--alpha-cream-16)',
    color: 'var(--text-inverse)',
    hover: {
      background: 'rgba(251,246,238,.26)'
    }
  }
};
const dims = {
  sm: 36,
  md: 44,
  lg: 52
};
function IconButton({
  children,
  label,
  tone = 'quiet',
  size = 'md',
  round = true,
  active = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    "aria-pressed": active || undefined,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      width: dims[size],
      height: dims[size],
      display: 'inline-grid',
      placeItems: 'center',
      border: t.border || '1px solid transparent',
      background: t.background,
      color: t.color,
      borderRadius: round ? 'var(--radius-pill)' : 'var(--radius-md)',
      cursor: 'pointer',
      padding: 0,
      transition: 'transform var(--duration-fast) var(--ease-cozy), background var(--duration-fast) var(--ease-cozy)',
      ...(hover ? t.hover : null),
      ...(active ? {
        background: 'var(--surface-accent-soft)',
        color: 'var(--text-accent)'
      } : null),
      ...(press ? {
        transform: 'scale(var(--press-scale))'
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  selected = false,
  icon,
  onClick,
  onRemove,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    "aria-pressed": selected,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      minHeight: '40px',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-xs)',
      fontWeight: 'var(--weight-bold)',
      border: '1px solid ' + (selected ? 'transparent' : 'var(--border-soft)'),
      background: selected ? 'var(--surface-ink)' : hover ? 'var(--surface-page-warm)' : 'var(--surface-card)',
      color: selected ? 'var(--text-inverse)' : 'var(--text-secondary)',
      transition: 'background var(--duration-fast) var(--ease-cozy), color var(--duration-fast) var(--ease-cozy)',
      ...style
    }
  }, rest), icon, children, onRemove && /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      opacity: .5,
      fontSize: 'var(--size-sm)',
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function EmptyState({
  hand,
  title,
  body,
  art,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      justifyItems: 'center',
      gap: 'var(--space-5)',
      textAlign: 'center',
      padding: 'var(--space-9) var(--space-7)',
      ...style
    }
  }, rest), art, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-3)',
      maxWidth: 300
    }
  }, hand && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-xl)',
      color: 'var(--text-accent)'
    }
  }, hand), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-lg)',
      margin: 0
    }
  }, title), body && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-xs)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, body)), action);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Sheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Sheet({
  open = true,
  title,
  hand,
  children,
  actions,
  onClose,
  inline = false,
  style,
  ...rest
}) {
  if (!open) return null;
  const panel = /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
      padding: 'var(--space-5) var(--gutter-screen) var(--space-8)',
      boxShadow: 'var(--shadow-sheet)',
      display: 'grid',
      gap: 'var(--space-5)',
      ...(inline ? {
        borderRadius: 'var(--radius-xl)'
      } : null),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 5,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--calico-biscuit)',
      justifySelf: 'center'
    }
  }), (hand || title) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 2
    }
  }, hand && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-lg)',
      color: 'var(--text-accent)'
    }
  }, hand), title && /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-xl)',
      margin: 0
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-5)'
    }
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-3)'
    }
  }, actions));
  if (inline) return panel;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--surface-scrim)',
      backdropFilter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, panel));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Toast({
  message,
  hand,
  icon,
  tone = 'ink',
  action,
  style,
  ...rest
}) {
  const tones = {
    ink: {
      background: 'var(--surface-ink)',
      color: 'var(--text-inverse)'
    },
    forest: {
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)'
    },
    accent: {
      background: 'var(--accent-primary)',
      color: 'var(--text-on-accent)'
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      padding: '12px var(--space-5)',
      boxShadow: 'var(--shadow-lg)',
      ...tones[tone],
      ...style
    }
  }, rest), icon, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: hand ? 'var(--font-hand)' : 'var(--font-ui)',
      fontSize: hand ? 'var(--size-lg)' : 'var(--size-xs)',
      fontWeight: 'var(--weight-bold)'
    }
  }, message), action);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  description,
  checked = false,
  disabled,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      minHeight: 'var(--hit-min)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 24,
      height: 24,
      flex: '0 0 24px',
      marginTop: 2,
      borderRadius: '8px',
      background: checked ? 'var(--surface-ink)' : 'var(--surface-card)',
      border: '1px solid ' + (checked ? 'transparent' : 'var(--border-strong)'),
      display: 'grid',
      placeItems: 'center',
      color: 'var(--text-inverse)',
      transition: 'background var(--duration-fast) var(--ease-cozy)'
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  value,
  placeholder,
  type = 'text',
  icon,
  error,
  disabled,
  multiline = false,
  rows = 3,
  onChange,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const Field = multiline ? 'textarea' : 'input';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 'var(--space-3)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: multiline ? 'flex-start' : 'center',
      gap: 'var(--space-4)',
      background: disabled ? 'var(--surface-quiet)' : 'var(--surface-card)',
      border: '1px solid ' + (error ? 'var(--status-danger)' : focus ? 'var(--accent-primary)' : 'var(--border-soft)'),
      borderRadius: 'var(--radius-md)',
      padding: '0 var(--space-5)',
      minHeight: 'var(--hit-min)',
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      transition: 'border-color var(--duration-fast) var(--ease-cozy), box-shadow var(--duration-fast) var(--ease-cozy)'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'grid',
      placeItems: 'center',
      paddingTop: multiline ? 13 : 0
    }
  }, icon), /*#__PURE__*/React.createElement(Field, _extends({
    type: multiline ? undefined : type,
    rows: multiline ? rows : undefined,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-sm)',
      color: 'var(--text-primary)',
      padding: multiline ? '13px 0' : '12px 0',
      resize: 'none',
      lineHeight: 'var(--leading-relaxed)'
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      color: error ? 'var(--status-danger)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SearchField({
  value,
  placeholder = 'Search titles, authors, moods…',
  icon,
  onChange,
  onClear,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + (focus ? 'var(--accent-primary)' : 'var(--border-soft)'),
      padding: '0 var(--space-6)',
      minHeight: 'var(--hit-min)',
      boxShadow: focus ? 'var(--ring-focus)' : 'var(--shadow-xs)',
      transition: 'border-color var(--duration-fast) var(--ease-cozy), box-shadow var(--duration-fast) var(--ease-cozy)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'grid',
      placeItems: 'center'
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    value: value,
    placeholder: placeholder,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-sm)',
      color: 'var(--text-primary)',
      padding: '12px 0'
    }
  }, rest)), value && onClear && /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    "aria-label": "Clear search",
    style: {
      border: 'none',
      background: 'var(--surface-quiet)',
      color: 'var(--text-secondary)',
      width: 26,
      height: 26,
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  value,
  options = [],
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 'var(--space-3)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange,
    style: {
      width: '100%',
      appearance: 'none',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-md)',
      padding: '13px var(--space-9) 13px var(--space-5)',
      minHeight: 'var(--hit-min)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-primary)',
      cursor: 'pointer'
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: typeof o === 'string' ? o : o.value,
    value: typeof o === 'string' ? o : o.value
  }, typeof o === 'string' ? o : o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 'var(--space-5)',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--text-muted)',
      pointerEvents: 'none',
      fontSize: 11
    }
  }, "\u25BE")));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  label,
  description,
  checked = false,
  disabled,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-5)',
      minHeight: 'var(--hit-min)',
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, rest), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      color: 'var(--text-muted)'
    }
  }, description)), /*#__PURE__*/React.createElement("button", {
    role: "switch",
    "aria-checked": checked,
    "aria-label": label,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 52,
      height: 32,
      flex: '0 0 52px',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      padding: 3,
      background: checked ? 'var(--accent-primary)' : 'var(--calico-biscuit)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      justifyContent: checked ? 'flex-end' : 'flex-start',
      transition: 'background var(--duration-base) var(--ease-cozy)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--calico-white)',
      boxShadow: 'var(--shadow-xs)',
      transition: 'transform var(--duration-base) var(--ease-purr)'
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ScreenHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ScreenHeader({
  title,
  eyebrow,
  hand,
  leading,
  trailing,
  tone = 'page',
  style,
  ...rest
}) {
  const inverse = tone === 'inverse';
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--space-4)',
      padding: 'var(--space-5) var(--gutter-screen) var(--space-5)',
      background: inverse ? 'transparent' : 'transparent',
      color: inverse ? 'var(--text-inverse)' : 'var(--text-primary)',
      ...style
    }
  }, rest), leading, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'grid',
      gap: '2px'
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-3xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: inverse ? 'var(--text-inverse-muted)' : 'var(--text-muted)'
    }
  }, eyebrow), hand && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-lg)',
      color: inverse ? 'var(--accent-secondary)' : 'var(--text-accent)',
      lineHeight: 1.1
    }
  }, hand), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-2xl)',
      letterSpacing: 'var(--tracking-tight)',
      lineHeight: 1.08,
      margin: 0,
      color: 'inherit'
    }
  }, title)), trailing);
}
Object.assign(__ds_scope, { ScreenHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ScreenHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SegmentedControl({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      background: 'var(--surface-quiet)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px',
      gap: '2px',
      ...style
    }
  }, rest), items.map(it => {
    const id = typeof it === 'string' ? it : it.id;
    const label = typeof it === 'string' ? it : it.label;
    const active = id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => onChange && onChange(id),
      style: {
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-pill)',
        padding: '9px 18px',
        minHeight: '38px',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--size-xs)',
        fontWeight: 'var(--weight-bold)',
        background: active ? 'var(--surface-card)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        boxShadow: active ? 'var(--shadow-xs)' : 'none',
        transition: 'background var(--duration-fast) var(--ease-cozy), color var(--duration-fast) var(--ease-cozy)'
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TabBar({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-soft)',
      padding: 'var(--space-3) var(--space-4) var(--space-5)',
      minHeight: 'var(--bottom-nav-height)',
      boxShadow: '0 -6px 20px rgba(84,51,46,.06)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => onChange && onChange(it.id),
      "aria-current": active || undefined,
      style: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'grid',
        justifyItems: 'center',
        gap: '3px',
        padding: '6px 10px',
        minWidth: 'var(--hit-min)',
        minHeight: 'var(--hit-min)',
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
        transition: 'color var(--duration-fast) var(--ease-cozy)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'grid',
        placeItems: 'center',
        height: 24
      }
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--size-3xs)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: '.02em'
      }
    }, it.label), /*#__PURE__*/React.createElement("span", {
      style: {
        width: active ? 16 : 0,
        height: 3,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--accent-primary)',
        transition: 'width var(--duration-base) var(--ease-purr)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/reading/ActivityRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ActivityRow({
  name,
  action,
  time,
  avatarSrc,
  ring = 'none',
  trailing,
  tone = 'paper',
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    paper: {
      background: 'var(--surface-card)',
      color: 'var(--text-primary)',
      sub: 'var(--text-secondary)',
      border: '1px solid var(--border-soft)'
    },
    inverse: {
      background: 'var(--alpha-cream-72)',
      color: 'var(--text-primary)',
      sub: 'var(--text-secondary)',
      border: '1px solid transparent'
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      background: t.background,
      border: t.border,
      borderRadius: 'var(--radius-md)',
      padding: '10px var(--space-4)',
      minHeight: 'var(--hit-min)',
      boxShadow: 'var(--shadow-xs)',
      cursor: onClick ? 'pointer' : undefined,
      transform: onClick && hover ? 'translateY(-1px)' : undefined,
      transition: 'transform var(--duration-fast) var(--ease-cozy)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatarSrc,
    size: "sm",
    ring: ring
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'grid',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-xs)',
      fontWeight: 'var(--weight-bold)',
      color: t.color
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      color: t.sub,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, action)), time && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-3xs)',
      color: 'var(--text-muted)'
    }
  }, time), trailing);
}
Object.assign(__ds_scope, { ActivityRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/ActivityRow.jsx", error: String((e && e.message) || e) }); }

// components/reading/BookCover.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const palettes = {
  marmalade: {
    bg: 'var(--calico-marmalade)',
    ink: '#2A1206',
    sub: 'rgba(42,18,6,.66)'
  },
  forest: {
    bg: 'var(--calico-forest)',
    ink: 'var(--calico-cream)',
    sub: 'rgba(251,246,238,.62)'
  },
  petal: {
    bg: 'var(--calico-petal)',
    ink: '#7E3C48',
    sub: 'rgba(126,60,72,.68)'
  },
  ink: {
    bg: 'var(--calico-ink)',
    ink: 'var(--calico-cream)',
    sub: 'rgba(251,246,238,.56)'
  },
  biscuit: {
    bg: 'var(--calico-biscuit)',
    ink: 'var(--calico-espresso)',
    sub: 'rgba(84,51,46,.66)'
  },
  sage: {
    bg: 'var(--calico-sage)',
    ink: '#2C3018',
    sub: 'rgba(44,48,24,.62)'
  },
  honeycomb: {
    bg: 'var(--calico-honeycomb)',
    ink: '#5A3708',
    sub: 'rgba(90,55,8,.66)'
  },
  cream: {
    bg: 'var(--calico-crumpet)',
    ink: 'var(--calico-espresso)',
    sub: 'rgba(84,51,46,.6)'
  }
};
const widths = {
  xs: 48,
  sm: 64,
  md: 92,
  lg: 124,
  xl: 168
};
function BookCover({
  title = '',
  author,
  cover = 'marmalade',
  size = 'md',
  src,
  tilt = 0,
  style,
  ...rest
}) {
  const w = widths[size];
  const p = palettes[cover] || palettes.marmalade;
  const titleSize = Math.max(9, Math.round(w * .135));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: w,
      height: Math.round(w * 1.48),
      flex: '0 0 auto',
      position: 'relative',
      borderRadius: 'var(--radius-cover)',
      overflow: 'hidden',
      background: p.bg,
      boxShadow: 'var(--shadow-cover)',
      transform: tilt ? 'rotate(' + tilt + 'deg)' : undefined,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: Math.round(w * .11),
      boxSizing: 'border-box',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: title,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: titleSize,
      lineHeight: 1.12,
      letterSpacing: '-.01em',
      color: p.ink
    }
  }, title), author && size !== 'xs' && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: Math.max(7, Math.round(w * .075)),
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: p.sub
    }
  }, author)), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: '0 auto 0 0',
      width: Math.max(3, Math.round(w * .045)),
      background: 'linear-gradient(90deg,rgba(28,23,20,.22),rgba(28,23,20,0))'
    }
  }));
}
Object.assign(__ds_scope, { BookCover });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/BookCover.jsx", error: String((e && e.message) || e) }); }

// components/reading/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressBar({
  value = 0,
  label,
  tone = 'accent',
  height = 8,
  showValue = false,
  style,
  ...rest
}) {
  const fill = {
    accent: 'var(--accent-primary)',
    forest: 'var(--accent-tertiary)',
    honey: 'var(--accent-secondary)',
    ink: 'var(--surface-ink)'
  }[tone];
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gap: 'var(--space-3)',
      ...style
    }
  }, rest), (label || showValue) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 'var(--space-4)'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-secondary)'
    }
  }, label), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-muted)'
    }
  }, pct, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--calico-biscuit)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: fill,
      transition: 'width var(--duration-slow) var(--ease-cozy)'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/reading/BookCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function BookCard({
  title,
  author,
  cover = 'marmalade',
  src,
  progress,
  meta,
  badge,
  action,
  layout = 'row',
  onClick,
  style,
  ...rest
}) {
  if (layout === 'stack') {
    return /*#__PURE__*/React.createElement("div", _extends({
      onClick: onClick,
      style: {
        display: 'grid',
        gap: 'var(--space-4)',
        width: 124,
        cursor: onClick ? 'pointer' : undefined,
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement(__ds_scope.BookCover, {
      title: title,
      author: author,
      cover: cover,
      src: src,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--weight-bold)',
        fontSize: 'var(--size-xs)',
        lineHeight: 1.25,
        color: 'var(--text-primary)'
      }
    }, title), author && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--size-3xs)',
        color: 'var(--text-muted)'
      }
    }, author)), typeof progress === 'number' && /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
      value: progress,
      height: 6
    }));
  }
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    tone: "paper",
    pad: "md",
    onClick: onClick,
    style: {
      display: 'flex',
      gap: 'var(--space-5)',
      alignItems: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.BookCover, {
    title: title,
    author: author,
    cover: cover,
    src: src,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'grid',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-4)',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      display: 'grid',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-md)',
      lineHeight: 1.2,
      color: 'var(--text-primary)'
    }
  }, title), author && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      color: 'var(--text-muted)'
    }
  }, author)), badge && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "accent"
  }, badge)), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      color: 'var(--text-secondary)'
    }
  }, meta), typeof progress === 'number' && /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: progress,
    height: 6
  })), action);
}
Object.assign(__ds_scope, { BookCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/BookCard.jsx", error: String((e && e.message) || e) }); }

// components/reading/QuoteCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function QuoteCard({
  quote,
  source,
  tone = 'warm',
  hand = false,
  action,
  style,
  ...rest
}) {
  const tones = {
    warm: {
      background: 'var(--surface-page-warm)',
      color: 'var(--text-primary)',
      rule: 'var(--accent-primary)'
    },
    forest: {
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      rule: 'var(--accent-secondary)'
    },
    paper: {
      background: 'var(--surface-card)',
      color: 'var(--text-primary)',
      rule: 'var(--accent-pink)'
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: t.background,
      color: t.color,
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-7)',
      display: 'grid',
      gap: 'var(--space-5)',
      boxShadow: 'var(--shadow-sm)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-4xl)',
      lineHeight: .6,
      color: t.rule
    }
  }, "\u201C"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: hand ? 'var(--font-hand)' : 'var(--font-reader)',
      fontSize: hand ? 'var(--size-xl)' : 'var(--size-lg)',
      fontWeight: hand ? 'var(--weight-bold)' : 'var(--weight-regular)',
      lineHeight: hand ? 1.35 : 'var(--leading-reader)',
      margin: 0
    }
  }, quote), source && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--size-2xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      opacity: .72
    }
  }, source), action);
}
Object.assign(__ds_scope, { QuoteCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/QuoteCard.jsx", error: String((e && e.message) || e) }); }

// components/reading/StreakRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StreakRing({
  value = 0,
  max = 100,
  size = 96,
  caption,
  unit,
  tone = 'accent',
  style,
  ...rest
}) {
  const stroke = Math.max(7, Math.round(size * .095));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const color = {
    accent: 'var(--accent-primary)',
    forest: 'var(--accent-tertiary)',
    honey: 'var(--accent-secondary)'
  }[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      display: 'grid',
      justifyItems: 'center',
      gap: 'var(--space-3)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      display: 'block',
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--calico-biscuit)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - pct),
    style: {
      transition: 'stroke-dashoffset var(--duration-slow) var(--ease-cozy)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: Math.round(size * .3),
      lineHeight: 1,
      color: 'var(--text-primary)'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: Math.round(size * .1),
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, unit))), caption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--size-md)',
      color: 'var(--text-secondary)',
      textAlign: 'center'
    }
  }, caption));
}
Object.assign(__ds_scope, { StreakRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reading/StreakRing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/App.jsx
try { (() => {
const {
  TabBar,
  Toast
} = window.CalicoDesignSystem_3b5126;
function CalicoApp() {
  const {
    Home,
    Books,
    Compass,
    Users,
    User
  } = window.Icons;
  const [route, setRoute] = React.useState('onboarding');
  const [tab, setTab] = React.useState('home');
  const [book, setBook] = React.useState(null);
  const [night, setNight] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const openBook = b => {
    setBook(b);
    setRoute('book');
  };
  const chrome = route !== 'onboarding' && route !== 'reader' && route !== 'book';
  let screen = null,
    statusTone = 'page',
    bg = 'var(--surface-page)';
  if (route === 'onboarding') screen = /*#__PURE__*/React.createElement(OnboardingScreen, {
    onStart: () => setRoute('app')
  });else if (route === 'reader') screen = /*#__PURE__*/React.createElement(ReaderScreen, {
    onBack: () => setRoute(book ? 'book' : 'app'),
    night: night,
    onNight: setNight
  });else if (route === 'book') screen = /*#__PURE__*/React.createElement(BookDetailScreen, {
    book: book,
    onBack: () => setRoute('app'),
    onOpenReader: () => setRoute('reader'),
    onToast: setToast
  });else if (tab === 'shelf') screen = /*#__PURE__*/React.createElement(LibraryScreen, {
    onOpenBook: openBook
  });else if (tab === 'friends') {
    screen = /*#__PURE__*/React.createElement(FriendsScreen, null);
    statusTone = 'inverse';
    bg = 'var(--surface-inverse)';
  } else screen = /*#__PURE__*/React.createElement(HomeScreen, {
    onOpenBook: openBook,
    onOpenReader: () => setRoute('reader')
  });
  return /*#__PURE__*/React.createElement(PhoneFrame, {
    statusTone: statusTone,
    background: bg,
    night: night && route === 'reader'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      background: route === 'friends' ? undefined : undefined
    }
  }, screen), chrome && /*#__PURE__*/React.createElement(TabBar, {
    value: tab,
    onChange: setTab,
    items: [{
      id: 'home',
      label: 'Home',
      icon: /*#__PURE__*/React.createElement(Home, null)
    }, {
      id: 'shelf',
      label: 'Shelf',
      icon: /*#__PURE__*/React.createElement(Books, null)
    }, {
      id: 'discover',
      label: 'Discover',
      icon: /*#__PURE__*/React.createElement(Compass, null)
    }, {
      id: 'friends',
      label: 'Friends',
      icon: /*#__PURE__*/React.createElement(Users, null)
    }, {
      id: 'you',
      label: 'You',
      icon: /*#__PURE__*/React.createElement(User, null)
    }]
  }), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: chrome ? 88 : 30,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    message: toast
  })));
}
Object.assign(window, {
  CalicoApp
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/BookDetailScreen.jsx
try { (() => {
const {
  Button,
  IconButton,
  Badge,
  Card,
  Tag,
  Avatar,
  BookCover,
  ProgressBar,
  QuoteCard,
  Sheet,
  ScreenHeader
} = window.CalicoDesignSystem_3b5126;
function BookDetailScreen({
  book,
  onBack,
  onOpenReader,
  onToast
}) {
  const {
    ArrowLeft,
    Bookmark,
    Share,
    Heart,
    Check
  } = window.Icons;
  const [sheet, setSheet] = React.useState(false);
  const [shelf, setShelf] = React.useState('Cozy nights');
  const b = book || window.CALICO_DATA.current;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page-warm)',
      padding: '0 var(--gutter-screen) 22px',
      borderRadius: '0 0 var(--radius-2xl) var(--radius-2xl)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0 4px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Back",
    tone: "card",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(ArrowLeft, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Share",
    tone: "card"
  }, /*#__PURE__*/React.createElement(Share, null)), /*#__PURE__*/React.createElement(IconButton, {
    label: "Save",
    tone: "card",
    active: true
  }, /*#__PURE__*/React.createElement(Bookmark, null)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'flex-end',
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: b.title,
    author: b.author,
    cover: b.cover,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, b.progress ? 'Reading now' : 'On your list'), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      lineHeight: 1.1,
      margin: 0
    }
  }, b.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, b.author), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "318 pages \xB7 5h 20m")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px var(--gutter-screen) 0',
      display: 'grid',
      gap: 14
    }
  }, typeof b.progress === 'number' && /*#__PURE__*/React.createElement(ProgressBar, {
    value: b.progress,
    label: b.meta || 'Your progress',
    showValue: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    hand: true,
    style: {
      flex: 1
    },
    onClick: onOpenReader
  }, b.progress ? 'Keep reading' : 'Start reading'), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setSheet(true)
  }, "Shelf")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-reader)',
      fontSize: 15.5,
      lineHeight: 1.7,
      color: 'var(--text-primary)',
      margin: 0
    }
  }, "A small book about the ordinary repairs we make to our days \u2014 walks, kettles, unanswered letters \u2014 and how they add up to a brighter year."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, ['Comfort read', 'Memoir', 'Slow mornings'].map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement(Card, {
    tone: "paper",
    pad: "md",
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "3 friends have read this"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Maya",
    size: "sm",
    ring: "accent"
  }), /*#__PURE__*/React.createElement(Avatar, {
    name: "Omar",
    size: "sm",
    tone: "pink",
    ring: "pink"
  }), /*#__PURE__*/React.createElement(Avatar, {
    name: "Ida",
    size: "sm",
    tone: "forest",
    ring: "honey"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 17,
      color: 'var(--text-secondary)',
      marginLeft: 4
    }
  }, "Omar loved it"))), /*#__PURE__*/React.createElement(QuoteCard, {
    tone: "paper",
    quote: "It is not a book that changes you. It is the twenty minutes you gave it.",
    source: "Ida \xB7 highlighted p. 64"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 26
    }
  }))), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet,
    hand: "nice pick!",
    title: "Add to a shelf",
    onClose: () => setSheet(false),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      block: true,
      onClick: () => {
        setSheet(false);
        onToast && onToast('Saved to ' + shelf);
      },
      icon: /*#__PURE__*/React.createElement(Check, {
        size: 18
      })
    }, "Add to shelf"), /*#__PURE__*/React.createElement(Button, {
      block: true,
      variant: "ghost",
      onClick: () => setSheet(false)
    }, "Not now"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, ['Cozy nights', 'Read in 2026', 'Lent out', 'Comfort re-reads'].map(s => /*#__PURE__*/React.createElement(Tag, {
    key: s,
    selected: shelf === s,
    onClick: () => setShelf(s)
  }, s)))));
}
Object.assign(window, {
  BookDetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/BookDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/FriendsScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Card,
  Avatar,
  ActivityRow,
  Button,
  BookCover,
  ScreenHeader,
  Badge,
  IconButton
} = window.CalicoDesignSystem_3b5126;
function FriendsScreen() {
  const d = window.CALICO_DATA;
  const {
    Bell,
    Users
  } = window.Icons;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-inverse)',
      padding: '0 var(--gutter-screen) 22px',
      borderRadius: '0 0 var(--radius-2xl) var(--radius-2xl)'
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, {
    tone: "inverse",
    hand: "Good Books, Good People",
    title: "Don't miss what your friends are reading",
    style: {
      padding: '8px 0 16px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, d.friends.slice(0, 2).map(fr => /*#__PURE__*/React.createElement(ActivityRow, _extends({
    key: fr.name,
    tone: "inverse"
  }, fr))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px var(--gutter-screen) 0',
      display: 'grid',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4
    }
  }, [...d.friends, ...d.friends].map((fr, i) => /*#__PURE__*/React.createElement(Avatar, {
    key: i,
    name: fr.name,
    size: "lg",
    ring: ['accent', 'pink', 'honey', 'forest'][i % 4]
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, "Get notified about their latest books, reviews and recommendations."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    hand: true,
    block: true
  }, "Turn on notifications"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontFamily: 'var(--font-ui)',
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "Maybe later"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      paddingTop: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      margin: 0
    }
  }, "This week together"), d.friends.map(fr => /*#__PURE__*/React.createElement(ActivityRow, _extends({
    key: fr.name
  }, fr, {
    ring: fr.ring,
    trailing: /*#__PURE__*/React.createElement(BookCover, {
      title: "\u2022",
      cover: "biscuit",
      size: "xs",
      style: {
        width: 26,
        height: 38
      }
    })
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 26
    }
  })));
}
Object.assign(window, {
  FriendsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/FriendsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Card,
  Badge,
  Tag,
  Avatar,
  Button,
  IconButton,
  BookCard,
  BookCover,
  ProgressBar,
  StreakRing,
  QuoteCard,
  ActivityRow,
  ScreenHeader
} = window.CalicoDesignSystem_3b5126;
function HomeScreen({
  onOpenBook,
  onOpenReader
}) {
  const d = window.CALICO_DATA;
  const {
    Bell,
    Search,
    More,
    Quote,
    ArrowRight
  } = window.Icons;
  return /*#__PURE__*/React.createElement("div", {
    className: "calico-paper",
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, {
    hand: d.reader.greeting,
    title: d.reader.name + "'s evening",
    trailing: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      label: "Search",
      tone: "quiet"
    }, /*#__PURE__*/React.createElement(Search, null)), /*#__PURE__*/React.createElement(IconButton, {
      label: "Notifications",
      tone: "quiet"
    }, /*#__PURE__*/React.createElement(Bell, null)))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter-screen) 8px'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "forest",
    radius: "xl",
    pad: "lg",
    style: {
      display: 'grid',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: d.current.title,
    author: d.current.author,
    cover: d.current.cover,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "honey"
  }, "Reading now"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 21,
      lineHeight: 1.15
    }
  }, d.current.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 12,
      color: 'var(--text-inverse-muted)',
      marginTop: 2
    }
  }, d.current.author)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11.5,
      color: 'var(--text-inverse-muted)'
    }
  }, d.current.meta))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: 'rgba(251,246,238,.22)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: d.current.progress + '%',
      height: '100%',
      borderRadius: 999,
      background: 'var(--accent-secondary)'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    hand: true,
    block: true,
    onClick: onOpenReader,
    iconAfter: /*#__PURE__*/React.createElement(ArrowRight, {
      size: 18
    })
  }, "Keep reading")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px var(--gutter-screen) 0',
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      margin: 0
    }
  }, "Tonight's shelf"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 17,
      color: 'var(--text-accent)'
    }
  }, "see all"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      overflowX: 'auto',
      padding: '12px var(--gutter-screen) 4px'
    }
  }, d.shelf.slice(0, 4).map(b => /*#__PURE__*/React.createElement(BookCard, _extends({
    key: b.title,
    layout: "stack"
  }, b, {
    onClick: () => onOpenBook(b)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px var(--gutter-screen) 0',
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "paper",
    pad: "md",
    style: {
      flex: 1,
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(StreakRing, {
    value: 24,
    max: 30,
    size: 72,
    unit: "min"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16
    }
  }, "Nearly there"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11.5,
      color: 'var(--text-muted)'
    }
  }, "6 minutes to your goal"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--text-accent)'
    }
  }, "12 day streak")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px var(--gutter-screen) 0',
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(QuoteCard, {
    quote: d.highlight.quote,
    source: d.highlight.source,
    tone: "warm",
    action: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.1em',
        textTransform: 'uppercase'
      }
    }, /*#__PURE__*/React.createElement(Quote, {
      size: 16
    }), " Saved highlight")
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px var(--gutter-screen) 0',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      margin: 0
    }
  }, "Friends are reading"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '2px 0 6px'
    }
  }, d.friends.map(fr => /*#__PURE__*/React.createElement(Avatar, {
    key: fr.name,
    name: fr.name,
    ring: fr.ring
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 44,
      height: 44,
      borderRadius: 999,
      border: '1px dashed var(--border-strong)',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-ui)',
      fontSize: 12,
      fontWeight: 700
    }
  }, "+9")), d.friends.slice(0, 3).map(fr => /*#__PURE__*/React.createElement(ActivityRow, _extends({
    key: fr.name
  }, fr)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px var(--gutter-screen) 0',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      margin: 0
    }
  }, "What's the mood?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, d.moods.map((m, i) => /*#__PURE__*/React.createElement(Tag, {
    key: m,
    selected: i === 0
  }, m)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 28
    }
  }));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/Icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide (ISC) glyph geometry, wrapped for React. 1.75 stroke, 24 grid.
const Ico = ({
  d,
  size = 22,
  fill = 'none',
  style
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: style,
  dangerouslySetInnerHTML: {
    __html: d
  }
});
const Icons = {
  Home: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/>"
  }, p)),
  Books: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\"/><path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\"/>"
  }, p)),
  Compass: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polygon points=\"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76\"/>"
  }, p)),
  Users: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>"
  }, p)),
  User: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>"
  }, p)),
  Search: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>"
  }, p)),
  Bookmark: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z\"/>"
  }, p)),
  Heart: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7Z\"/>"
  }, p)),
  Plus: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M5 12h14\"/><path d=\"M12 5v14\"/>"
  }, p)),
  ArrowRight: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/>"
  }, p)),
  ArrowLeft: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M19 12H5\"/><path d=\"m12 19-7-7 7-7\"/>"
  }, p)),
  More: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/>"
  }, p)),
  X: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M18 6 6 18\"/><path d=\"M6 6l12 12\"/>"
  }, p)),
  Check: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M20 6 9 17l-5-5\"/>"
  }, p)),
  Moon: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\"/>"
  }, p)),
  Sun: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.9 4.9 1.4 1.4\"/><path d=\"m17.7 17.7 1.4 1.4\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.3 17.7-1.4 1.4\"/><path d=\"m19.1 4.9-1.4 1.4\"/>"
  }, p)),
  Type: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M4 7V4h16v3\"/><path d=\"M9 20h6\"/><path d=\"M12 4v16\"/>"
  }, p)),
  Clock: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>"
  }, p)),
  Quote: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v9a4 4 0 0 1-4 4\"/><path d=\"M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v9a4 4 0 0 1-4 4\"/>"
  }, p)),
  Share: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M12 3v12\"/><path d=\"m8 7 4-4 4 4\"/><path d=\"M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6\"/>"
  }, p)),
  Bell: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8\"/><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\"/>"
  }, p)),
  Settings: p => /*#__PURE__*/React.createElement(Ico, _extends({
    d: "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 2.6 15H3a2 2 0 1 1 0-4h-.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/>"
  }, p))
};
Object.assign(window, {
  Icons,
  Ico
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/LibraryScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SearchField,
  SegmentedControl,
  BookCard,
  IconButton,
  EmptyState,
  Button,
  ScreenHeader,
  Badge
} = window.CalicoDesignSystem_3b5126;
function LibraryScreen({
  onOpenBook
}) {
  const d = window.CALICO_DATA;
  const {
    Search,
    More,
    Plus
  } = window.Icons;
  const [view, setView] = React.useState('Reading');
  const [q, setQ] = React.useState('');
  const books = d.shelf.filter(b => b.shelf === view).filter(b => b.title.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    className: "calico-paper",
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, {
    eyebrow: "24 books \xB7 3 shelves",
    title: "Your shelf",
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      label: "Add a book",
      tone: "ink"
    }, /*#__PURE__*/React.createElement(Plus, null))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter-screen)',
      display: 'grid',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    icon: /*#__PURE__*/React.createElement(Search, {
      size: 18
    }),
    value: q,
    onChange: e => setQ(e.target.value),
    onClear: () => setQ(''),
    placeholder: "Search your shelf"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: view,
    onChange: setView,
    items: ['Reading', 'Finished', 'Want to read']
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px var(--gutter-screen) 28px',
      display: 'grid',
      gap: 12
    }
  }, books.length ? books.map(b => /*#__PURE__*/React.createElement(BookCard, _extends({
    key: b.title
  }, b, {
    onClick: () => onOpenBook(b),
    badge: b.progress === 100 ? 'Finished' : undefined,
    action: /*#__PURE__*/React.createElement(IconButton, {
      label: "More",
      tone: "quiet",
      size: "sm"
    }, /*#__PURE__*/React.createElement(More, {
      size: 18
    }))
  }))) : /*#__PURE__*/React.createElement(EmptyState, {
    hand: "nothing here yet \u2014",
    title: "This shelf is waiting",
    body: "Add a book and we'll keep your place, always.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "accent"
    }, "Find a book")
  })));
}
Object.assign(window, {
  LibraryScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/LibraryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/OnboardingScreen.jsx
try { (() => {
const {
  Button,
  BookCover
} = window.CalicoDesignSystem_3b5126;
function OnboardingScreen({
  onStart
}) {
  const {
    ArrowRight
  } = window.Icons;
  return /*#__PURE__*/React.createElement("div", {
    className: "calico-paper",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '0 24px 30px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 330,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 2,
      top: 6,
      width: 112,
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 21,
      lineHeight: 1.25,
      color: 'var(--text-primary)',
      transform: 'rotate(-5deg)'
    }
  }, "Different stories, brighter days"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 6,
      top: 104,
      width: 74,
      height: 3,
      borderRadius: 999,
      background: 'var(--accent-primary)',
      transform: 'rotate(-5deg)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      top: 150
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "ink",
    size: "md",
    tilt: -8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 290
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: "Small Habits, Big Changes",
    cover: "petal",
    size: "sm",
    tilt: -14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 8,
      top: 16
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: "Atlas of Human Kindness",
    cover: "forest",
    size: "md",
    tilt: 7
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 0,
      top: 170
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: "A Brighter You",
    cover: "honeycomb",
    size: "sm",
    tilt: 12
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 104,
      transform: 'translateX(-50%) rotate(-2deg)'
    }
  }, /*#__PURE__*/React.createElement(BookCover, {
    title: "Good Stories, Better People",
    author: "Calico",
    cover: "marmalade",
    size: "xl"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 42,
      lineHeight: 1.04,
      letterSpacing: '-.025em',
      margin: 0
    }
  }, "People", /*#__PURE__*/React.createElement("br", null), "who read"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 32,
      color: 'var(--accent-primary)',
      lineHeight: 1.1,
      marginTop: 2
    }
  }, "live different lives."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 196,
      height: 3,
      borderRadius: 999,
      background: 'var(--accent-primary)',
      marginTop: 4
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      margin: 0,
      maxWidth: 268
    }
  }, "See how many people are inspired by the books you read."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    hand: true,
    block: true,
    onClick: onStart,
    iconAfter: /*#__PURE__*/React.createElement(ArrowRight, {
      size: 20
    })
  }, "Let's go")));
}
Object.assign(window, {
  OnboardingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/OnboardingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/PhoneFrame.jsx
try { (() => {
function StatusBar({
  tone = 'page'
}) {
  const c = tone === 'inverse' ? 'var(--text-inverse)' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px 0 32px',
      color: c,
      flex: '0 0 auto',
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 15,
      fontWeight: 700
    }
  }, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "12",
    viewBox: "0 0 18 12",
    fill: c
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "8",
    width: "3",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "5.5",
    width: "3",
    height: "6.5",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "10",
    y: "3",
    width: "3",
    height: "9",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "15",
    y: "0",
    width: "3",
    height: "12",
    rx: "1"
  })), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "12",
    viewBox: "0 0 16 12",
    fill: "none",
    stroke: c,
    strokeWidth: "1.6"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 4.2a10 10 0 0 1 14 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3.6 7a6.4 6.4 0 0 1 8.8 0"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "10",
    r: "1",
    fill: c,
    stroke: "none"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 23,
      height: 12,
      border: '1.4px solid ' + c,
      borderRadius: 3.5,
      padding: 1.6,
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: '78%',
      height: '100%',
      background: c,
      borderRadius: 1.6
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1.6,
      height: 4,
      background: c,
      borderRadius: 1,
      opacity: .5
    }
  }))));
}
function PhoneFrame({
  children,
  statusTone = 'page',
  background = 'var(--surface-page)',
  night = false,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      justifyItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: night ? 'calico-night' : undefined,
    style: {
      width: 390,
      height: 844,
      borderRadius: 'var(--radius-phone)',
      background,
      position: 'relative',
      overflow: 'hidden',
      flex: '0 0 auto',
      boxShadow: '0 30px 70px rgba(84,51,46,.28), 0 0 0 10px #171310, 0 0 0 11px rgba(255,253,249,.12)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 112,
      height: 31,
      borderRadius: 999,
      background: '#0B0908',
      zIndex: 20
    }
  }), /*#__PURE__*/React.createElement(StatusBar, {
    tone: statusTone
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }
  }, children), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 134,
      height: 5,
      borderRadius: 999,
      background: statusTone === 'inverse' ? 'rgba(251,246,238,.5)' : 'rgba(28,23,20,.32)',
      zIndex: 20
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label));
}
Object.assign(window, {
  PhoneFrame,
  StatusBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/PhoneFrame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/ReaderScreen.jsx
try { (() => {
const {
  IconButton,
  Sheet,
  Switch,
  Select,
  Button,
  ProgressBar
} = window.CalicoDesignSystem_3b5126;
function ReaderScreen({
  onBack,
  night,
  onNight
}) {
  const d = window.CALICO_DATA;
  const {
    ArrowLeft,
    Type,
    Bookmark,
    Moon,
    Quote
  } = window.Icons;
  const [settings, setSettings] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px var(--space-5) 4px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Back",
    tone: "quiet",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(ArrowLeft, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "A Brighter You"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Highlights",
    tone: "quiet"
  }, /*#__PURE__*/React.createElement(Quote, {
    size: 20
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "Reading settings",
    tone: "quiet",
    onClick: () => setSettings(true)
  }, /*#__PURE__*/React.createElement(Type, {
    size: 20
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 26px 20px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, d.chapter.label), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 27,
      lineHeight: 1.14,
      margin: '8px 0 16px'
    }
  }, d.chapter.title), d.chapter.paragraphs.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      fontFamily: 'var(--font-reader)',
      fontSize: 17,
      lineHeight: 1.72,
      color: 'var(--text-primary)',
      margin: '0 0 15px'
    }
  }, i === 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      float: 'left',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 52,
      lineHeight: .84,
      color: 'var(--accent-primary)',
      padding: '5px 9px 0 0'
    }
  }, p[0]) : null, i === 0 ? p.slice(1) : p)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-reader)',
      fontSize: 17,
      lineHeight: 1.72,
      margin: '0 0 15px'
    }
  }, /*#__PURE__*/React.createElement("mark", {
    style: {
      background: 'var(--surface-accent-soft)',
      color: 'var(--text-primary)',
      padding: '2px 0',
      boxShadow: '6px 0 0 var(--surface-accent-soft), -6px 0 0 var(--surface-accent-soft)'
    }
  }, "She read the way other people breathed \u2014 steadily, without noticing.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-reader)',
      fontSize: 17,
      lineHeight: 1.72,
      color: 'var(--text-primary)',
      margin: 0
    }
  }, "At home she left the lamp on a while longer than she needed to, because the room looked kinder that way.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 26px 22px',
      display: 'grid',
      gap: 8,
      borderTop: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: 41,
    height: 6
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-ui)',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Page 112 of 318"), /*#__PURE__*/React.createElement("span", null, "9 min left in chapter"))), /*#__PURE__*/React.createElement(Sheet, {
    open: settings,
    title: "Reading settings",
    onClose: () => setSettings(false),
    actions: /*#__PURE__*/React.createElement(Button, {
      block: true,
      variant: "ghost",
      onClick: () => setSettings(false)
    }, "Done")
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Night Reading",
    description: "Warm dark paper after sunset",
    checked: night,
    onChange: onNight
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Typeface",
    value: "Calico Serif",
    options: ['Calico Serif', 'Calico Sans', 'System']
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Text size",
    value: "Medium",
    options: ['Small', 'Medium', 'Large', 'Largest']
  })));
}
Object.assign(window, {
  ReaderScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/ReaderScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/calico-app/data.js
try { (() => {
window.CALICO_DATA = {
  reader: {
    name: 'Maya',
    greeting: 'good evening,'
  },
  current: {
    title: 'A Brighter You',
    author: 'Nia Bell',
    cover: 'marmalade',
    progress: 38,
    meta: '2h 40m left · chapter 9 of 21'
  },
  shelf: [{
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover: 'ink',
    progress: 74,
    meta: '1h 05m left',
    shelf: 'Reading'
  }, {
    title: 'Atlas of Human Kindness',
    author: 'R. Okafor',
    cover: 'forest',
    progress: 12,
    meta: 'Started Tuesday',
    shelf: 'Reading'
  }, {
    title: 'Small Habits, Big Changes',
    author: 'J. Ferrer',
    cover: 'petal',
    progress: 100,
    meta: 'Finished in March',
    shelf: 'Finished'
  }, {
    title: 'Notes for a Calmer Mind',
    author: 'Ada Lin',
    cover: 'sage',
    meta: 'Added yesterday',
    shelf: 'Want to read'
  }, {
    title: 'Good Stories, Better People',
    author: 'T. Mensah',
    cover: 'honeycomb',
    progress: 100,
    meta: 'Finished in January',
    shelf: 'Finished'
  }, {
    title: 'Slow Mornings',
    author: 'Hana Ito',
    cover: 'biscuit',
    meta: 'From Omar',
    shelf: 'Want to read'
  }],
  friends: [{
    name: 'Maya',
    action: 'Added Atlas of Human Kindness to her shelf',
    time: 'now',
    ring: 'accent'
  }, {
    name: 'Omar',
    action: 'Finished The Midnight Library',
    time: '2m',
    ring: 'pink'
  }, {
    name: 'Ida',
    action: 'Highlighted a passage in Slow Mornings',
    time: '18m',
    ring: 'honey'
  }, {
    name: 'Ben',
    action: 'Started A Brighter You',
    time: 'yesterday',
    ring: 'forest'
  }],
  moods: ['Cozy fantasy', 'Slow mornings', 'Romance', 'Quiet sci-fi', 'Memoir', 'Comfort re-reads'],
  highlight: {
    quote: 'She read the way other people breathed — steadily, without noticing.',
    source: 'A Brighter You · p. 112'
  },
  chapter: {
    label: 'Chapter nine',
    title: 'The lamp by the window',
    paragraphs: ['The library stayed open past midnight that winter, and nobody minded. Rain kept the windows busy, and the radiator ticked like a patient clock.', 'She had brought three books and read none of them properly — a page here, a paragraph there, the way you taste things at a market. It was enough. Some nights reading is not about finishing.', 'Later, walking home with her collar up, she thought about how a story leaves the room with you.']
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/calico-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.ScreenHeader = __ds_scope.ScreenHeader;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.ActivityRow = __ds_scope.ActivityRow;

__ds_ns.BookCard = __ds_scope.BookCard;

__ds_ns.BookCover = __ds_scope.BookCover;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.QuoteCard = __ds_scope.QuoteCard;

__ds_ns.StreakRing = __ds_scope.StreakRing;

})();
