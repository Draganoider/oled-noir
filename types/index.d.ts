/** A look's id, such as `eclipse`, or null for none. */
export type AppliedLook = string | null

declare module 'claude-code' {
  interface PluginState {
    'oled-noir': {
      /** Whether the /noir card shows above the prompt. */
      isCardOpen: boolean
      /** The look this session shows. */
      applied: AppliedLook
    }
  }
}
