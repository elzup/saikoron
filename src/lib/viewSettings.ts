import type {
  Dice,
  Dice3DViewSettings,
  SampleViewSettings,
  SignageViewSettings,
} from '../types'
import { SIGNAGE_DEFAULT_INTERVAL } from './constants'

/**
 * View ごとの振り方/UI 設定へのアクセサ。
 * 設定は Dice.viewSettings[modeId] に (Dice×View) 単位で永続化される。
 * @see docs/model.md
 */

export const DEFAULT_DICE3D: Dice3DViewSettings = { rollCount: 1 }
export const DEFAULT_SAMPLE: SampleViewSettings = {
  count: 1,
  allowDuplicates: false,
}
export const DEFAULT_SIGNAGE: SignageViewSettings = {
  interval: SIGNAGE_DEFAULT_INTERVAL,
  displayCount: 1,
  loop: false,
}

export function getDice3dSettings(dice: Dice): Dice3DViewSettings {
  return { ...DEFAULT_DICE3D, ...(dice.viewSettings?.dice3d ?? {}) }
}

export function getSampleSettings(dice: Dice): SampleViewSettings {
  return { ...DEFAULT_SAMPLE, ...(dice.viewSettings?.sample ?? {}) }
}

export function getSignageSettings(dice: Dice): SignageViewSettings {
  return { ...DEFAULT_SIGNAGE, ...(dice.viewSettings?.signage ?? {}) }
}
