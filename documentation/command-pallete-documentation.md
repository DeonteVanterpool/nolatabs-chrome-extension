
<style>
  .wrap { padding: 1rem 0; }
  .panel { border-radius: var(--border-radius-lg); border: 0.5px solid var(--color-border-tertiary); display: flex; width: 100%; }
  .panel-label { font-size: 11px; font-weight: 500; color: var(--color-text-tertiary); letter-spacing: .05em; text-transform: uppercase; padding: 8px 14px; border-bottom: 0.5px solid var(--color-border-tertiary); background: var(--color-background-secondary); }
  .terminal { background: #0d0d0d; padding: 14px 16px; font-family: var(--font-mono); font-size: 11.5px; line-height: 1.55; color: #c8c8c8; min-height: 380px; }
  .dim { color: #555; }
  .bright { color: #e8e8e8; }
  .grn { color: #5a9e6a; }
  .yel { color: #9e8a3a; }
  .cyn { color: #3a7f9e; }
  .nice { background: var(--color-background-primary); padding: 14px 16px; min-height: 380px; width: 100%; }
  .cmd-row { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 0.5px solid var(--color-border-tertiary); width: 100%; }
  .cmd-row:last-child { border-bottom: none; }
  .n-alias { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-info); background: var(--color-background-info); padding: 1px 6px; border-radius: 4px; }
  .n-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; }
  .n-section { font-size: 10px; font-weight: 500; color: var(--color-text-tertiary); letter-spacing: .06em; text-transform: uppercase; padding: 10px 0 4px; }
  .n-arg { font-family: var(--font-mono); font-size: 10px; background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: 3px; padding: 1px 5px; color: var(--color-text-tertiary); margin-top: 3px; display: inline-block; float: right; margin-left: 3px; }
  .n-arg-necessary { font-family: var(--font-mono); font-size: 10px; background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: 3px; padding: 1px 5px; color: var(--color-text-primary); margin-top: 3px; display: inline-block; float: right; margin-left: 3px; }
  .anno { font-size: 11px; color: var(--color-text-tertiary); font-style: italic; padding: 4px 0 0; }
  .anno-row { display: flex; gap: 6px; align-items: flex-start; padding: 3px 0; }
  .problems { margin-top: 1rem; padding: 10px 14px; background: var(--color-background-secondary); border-radius: var(--border-radius-md); }
  .prob-item { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; font-size: 12px; color: var(--color-text-secondary); }
</style>

<div class="wrap">
  <div class="panel">
    <div class="panel-label">Command Palette</div>
    <div class="nice">
      <div class="n-section">help</div>
      <div class="cmd-row">
        <span class="n-cmd">tutorial</span>
        <div style="width: 100%"><span class="n-desc">Pull up this tutorial</span><br><span class="n-arg">level?</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">help</span>
        <div style="width: 100%"><span class="n-desc">Pull the help page</span><br><span class="n-arg">level?</span></div>
      </div>
      <div class="n-section">repos</div>
      <div class="cmd-row">
        <span class="n-cmd">mkdir</span>
        <div style="width: 100%"><span class="n-alias">new</span>&nbsp;<span class="n-desc">Create a collection of tabs</span><br><span class="n-arg">window: current | new</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">rm</span>
        <div style="width: 100%"><span class="n-alias">new</span>&nbsp;<span class="n-desc">Delete tab collection</span><br><span class="n-arg">window: current | new</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">cd</span>
        <div style="width: 100%"><span class="n-alias">open</span>&nbsp;<span class="n-desc">Switch collections</span><br><span class="n-arg">window: current | new</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">branch</span>
        <div style="width: 100%"><span class="n-desc">Create a new branch for the current repository</span><br><span class="n-arg-necessary">name</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">checkout</span>
        <div style="width: 100%"><span class="n-desc">Create a new branch for the current repository</span><br><span class="n-arg-necessary">name</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">merge</span>
        <div style="width: 100%"><span class="n-desc">Create a merge commit</span><br><span class="n-arg">merge | rebase</span><span class="n-arg-necessary">message</span></div>
      </div>
      </div>
    <div class="nice">
      <div class="n-section">saving</div>
      <div class="cmd-row">
        <span class="n-cmd">commit</span>
        <div style="width: 100%"><span class="n-alias">localsave</span>&nbsp;<span class="n-desc">Snapshot tab changes locally</span><br><span class="n-arg">message?</span>&nbsp;<span class="n-arg">review: n | y</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">status</span>
        <div style="width: 100%"><span class="n-alias">changes</span>&nbsp;<span class="n-desc">What's changed since last save</span></div>
      </div>
      <div class="n-section">remote</div>
      <div class="cmd-row">
        <span class="n-cmd">push</span>
        <div style="width: 100%"><span class="n-alias">upload</span>&nbsp;<span class="n-desc">Back up to the cloud</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">pull</span>
        <div><span class="n-alias">download</span>&nbsp;<span class="n-desc">Fetch from another device</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">sync</span>
        <div style="width: 100%"><span class="n-desc">Commit, pull then push in one step</span></div>
      </div>
      <div class="n-section">sharing</div>
      <div class="cmd-row">
        <span class="n-cmd">invite</span>
        <div style="width: 100%"><span class="n-desc">Add a collaborator</span><br><span class="n-arg-necessary">email | link | code</span></div>
      </div>
      <div class="cmd-row">
        <span class="n-cmd">share</span>
        <div style="width: 100%"><span class="n-desc">Creates a shareable link to a copy of the repository for the user. This link works for people who aren't users of nolatabs</span><br><span class="n-arg-necessary">email | link | code</span></div>
      </div>
      </div>
    </div>
</div>

