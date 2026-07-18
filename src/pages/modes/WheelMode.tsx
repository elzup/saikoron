import { useCallback } from 'react'
import { RouletteWheel } from '../../components/RouletteWheel'
import { useDice } from '../../hooks/useDice'
import type { DiceItem } from '../../types'
import { ModeLayout } from './ModeLayout'

export function WheelMode() {
  const { addHistory } = useDice()

  const handleResult = useCallback(
    (diceId: string, item: DiceItem) => {
      addHistory(diceId, item, 'wheel')
    },
    [addHistory]
  )

  return (
    <ModeLayout modeId='wheel'>
      {(dice) => (
        <RouletteWheel
          items={dice.items}
          onResult={(item) => handleResult(dice.id, item)}
        />
      )}
    </ModeLayout>
  )
}
