export const a11y = {
  roles: {
    application: "application",
    button: "button",
    dialog: "dialog",
    list: "list",
    listItem: "listitem",
    log: "log",
    main: "main",
    navigation: "navigation",
    progressbar: "progressbar",
    tab: "tab",
    tablist: "tablist",
    tabpanel: "tabpanel",
    textbox: "textbox",
    timer: "timer",
    toolbar: "toolbar",
    tooltip: "tooltip",
  },
  aria: {
    busy: (busy) => ({ "aria-busy": busy }),
    checked: (checked) => ({ "aria-checked": checked }),
    current: (current) => ({ "aria-current": current }),
    disabled: (disabled) => ({ "aria-disabled": disabled }),
    expanded: (expanded) => ({ "aria-expanded": expanded }),
    hidden: (hidden) => ({ "aria-hidden": hidden }),
    label: (label) => ({ "aria-label": label }),
    labelledBy: (id) => ({ "aria-labelledby": id }),
    live: (politeness) => ({ "aria-live": politeness }),
    pressed: (pressed) => ({ "aria-pressed": pressed }),
    selected: (selected) => ({ "aria-selected": selected }),
  },
};

export function srOnly(text) {
  return {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  };
}
