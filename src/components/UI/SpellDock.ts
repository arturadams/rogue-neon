type SpellSlotState = "locked" | "active" | "evo" | "synergy-active" | "idle";

export interface SpellSlotConfig {
  /** Unique key for the slot so callers can target it later. */
  id: string;
  /** Optional label or icon (emoji/text) to render. */
  icon?: string;
  /** Current level badge to display in the corner. */
  level?: number;
  /** Visual state for styling via CSS classes. */
  state?: SpellSlotState;
  /** Cooldown progress percentage (0-100). */
  cooldownPct?: number;
}

function renderSlot({ id, icon, level, state = "idle", cooldownPct = 0 }: SpellSlotConfig) {
  const classes = ["spell-slot", state === "idle" ? "" : state]
    .filter(Boolean)
    .join(" ");

  const lvlBadge = typeof level === "number" ? `<span class="spell-lvl">${level}</span>` : "";
  const iconGlyph = icon ? `<span class="spell-icon">${icon}</span>` : "";
  const cooldownStyle = `style="height:${Math.min(Math.max(cooldownPct, 0), 100)}%;"`;

  return `
    <div class="${classes}" data-slot="${id}">
      ${iconGlyph}
      <span class="spell-label">${id}</span>
      ${lvlBadge}
      <div class="cooldown-overlay" ${cooldownStyle}></div>
    </div>
  `;
}

/**
 * Recreates the spell dock container from the original static HTML. When no
 * slot data is provided it renders an empty dock that callers can populate
 * dynamically, matching the base project's markup.
 */
export function SpellDock(slots: SpellSlotConfig[] = []) {
  const renderedSlots = slots.map(renderSlot).join("");
  return `<div id="spell-dock" class="hud-panel" style="display:none;">${renderedSlots}</div>`;
}
