# Cut Editor

WHen going into the mini game from the cut editor (ie, press A with "play" highlighted), it reads REG_P1CNT at 275e

00274E: 1039 0038 0000 move.b $380000.l, D0
002754: 4640           not.w   D0
002756: 0240 000F      andi.w  #$f, D0
00275A: 1B40 04C8 move.b D0, ($4c8,A5)
00275E: 1039 0030 0000 move.b $300000.l, D0
002764: 4640 not.w D0
002766: 1B40 04C6 move.b D0, ($4c6,A5)
00276A: 1039 0034 0000 move.b $340000.l, D0
002770: 4640 not.w D0
002772: 1B40 04C7 move.b D0, ($4c7,A5)
002776: 4E75 rts

It nots it and sticks it at 1084c6

when pressing A to enter the mini game, 1084c6 is read at 2878, it loads it into d0 then bsr's to 2898

it does a few things and then sets the input value ($10) to 1084cc

it does a massive copy from (A1) to (A2), like 40 bytes or so

it then moves the input byte in d0 to d4

46ada - possibly the start of the game loop?
nope, as the main game hits here too
