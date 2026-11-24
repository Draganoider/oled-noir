/** A look's id, such as `eclipse`, or null for none. */
export type AppliedLook = string | null

/** How see-through the side panels are: `clear`, `light`, `frosted` or `solid`, or null before it is read. */
export type PanelGlass = string | null

declare module 'claude-code' {
  interface PluginState {
    'oled-noir': {
      /** Whether the /noir card shows above the prompt. */
      isCardOpen: boolean
      /** The look this session shows. */
      applied: AppliedLook
      /** The panel glass the card marks as chosen. */
      glass: PanelGlass
      /** What sits behind reply text, as the card marks it: `black`, `soft`, `smoky`, `dim`, `halo` or `none`. */
      text: string | null
      /** How your own messages look, as the card marks it: `outline`, `ring`, `soft`, `glass`, `inverted` or `none`. */
      bubble: string | null
      /** How tool call rows look, as the card marks it: `card`, `outline`, `terminal`, `pill`, `soft`, `quiet` or `none`. */
      tools: string | null
    }
  }
}
