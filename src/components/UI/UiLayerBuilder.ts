import { ControlsPanel } from "./ControlsPanel";
import { DatabaseModal } from "./Modals/DatabaseModal";
import { GameOverModal } from "./Modals/GameOverModal";
import { ItemModal } from "./Modals/ItemModal";
import { LevelUpModal } from "./Modals/LevelUpModal";
import { StartScreenModal } from "./Modals/StartScreenModal";
import { StarterModal } from "./Modals/StarterModal";
import { InventoryPanel } from "./InventoryPanel";
import { ProgressBar } from "./ProgressBar";
import { SpellDock } from "./SpellDock";
import { StatsPanel } from "./StatsPanel";

type UiComponentFactory = () => string;

export class UiLayerBuilder {
  private components: UiComponentFactory[];

  constructor(private readonly root: HTMLElement | null) {
    this.components = [
      ProgressBar,
      ControlsPanel,
      StatsPanel,
      SpellDock,
      InventoryPanel,
      StartScreenModal,
      StarterModal,
      LevelUpModal,
      ItemModal,
      DatabaseModal,
      GameOverModal,
    ];
  }

  mount(): void {
    if (!this.root) return;
    this.root.innerHTML = this.components.map((component) => component()).join("");
  }
}
