export function DatabaseModal() {
  return `
        <div id="database-modal" class="modal" style="width: 900px; max-width: 95%; text-align: left; display: none; z-index: 300;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                <h2 style="color: #00ffff; margin:0;" id="db-title">SYSTEM DATABASE</h2>
                <button style="background:none; border:1px solid #555; color:#888; cursor:pointer;">CLOSE</button>
            </div>
            <div id="db-content" class="db-grid"></div>
        </div>
    `;
}
