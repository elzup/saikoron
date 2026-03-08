import { useCallback } from 'react'
import { ModeLayout } from './ModeLayout'
import { SlotRoulette } from '../../components/SlotRoulette'
import { useDice } from '../../hooks/useDice'
import type { DiceItem } from '../../types'

export function SlotMode() {
  const { addHistory } = useDice()

  const handleResult = useCallback(
    (diceId: string, item: DiceItem) => {
      addHistory(diceId, item)
    },
    [addHistory]
  )

  return (
    <ModeLayout modeId="slot">
      {(dice) => (
        <SlotRoulette
          items={dice.items}
          onResult={(item) => handleResult(dice.id, item)}
        />
      )}
    </ModeLayout>
  )
}
