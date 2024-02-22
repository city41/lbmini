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

# sprites

sprite 153 is the first background sprite, it uses tiles 0 and 45f7b

loading this tile happens at d2da

this happens in a subroutine that starts at d18c
but the main game also jumps to that subroutine, sadly...

# current cut

the current cut number is stored at 100100

this is read many times while the cut editor is up. Upon pressing play to jump into the cut, it is read at 495c, which pulls it into d0 then writes it to 1006f0

the game reads 1006f0 when it is 1a at 64cb6

this miiiiiight be it setting up the mini game then jumping to it

064CAE: 45F9 0022 8000 lea $228000.l, A2
064CB4: 7000           moveq   #$0, D0
064CB6: 302C 00F0      move.w  ($f0,A4), D0
064CBA: E188 lsl.l #8, D0
064CBC: D5C0 adda.l D0, A2
064CBE: 294A 00F4 move.l A2, ($f4,A4)
064CC2: 28BC 0006 4CC8 move.l #$64cc8, (A4)
064CC8: 48E7 C000 movem.l D0-D1, -(A7)
064CCC: 303C 0002 move.w #$2, D0
064CD0: 4EB9 0004 633C jsr $4633c.l

it's not, as the main game goes here too, but maybe the address registers are different

### main game break

d0 a00
d1 1ffff
d2 400000
d3 0
d4 0
d5 75000e3f
d6 230
d7 ffff

a0 64c06
a1 10ec16
a2 228a00
a3 10000
a4 100a00
a5 108000
a6 3c0000 -- ie reg_vramaddr

### cut 1a break

d0 1a00
d1 1ffff
d2 400000
d3 200
d4 100
d5 75000e3f
d6 230
d7 ffff

a0 64956
a1 10ec16
a2 229a00
a3 100000
a4 100600
a5 108000
a6 3c0000 -- ie reg_vramaddr
