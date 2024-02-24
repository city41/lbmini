# Last Blade Hidden Mini Game Hack

Last Blade has a hidden mini game inside of it. But getting to it is pretty difficult and error prone.

This repo creates a patch that takes you straight to the mini game right when the game boots up (after the eyecatcher).

## How to use a MAME Lua script to see the mini game

If you don't want to bother with hacking the ROM, you can use MAME and a Lua script to see it. This script
does the same thing as the hack.

Download [miniGameHack.lua](https://raw.githubusercontent.com/city41/lbmini/main/src/lua/miniGameHack.lua)

Then launch MAME from the command line

```sh
mame -autoboot_script miniGameHack.lua lastblad
```

You might want to add some more flags to make MAME a bit nicer

```sh
mame -w -nofilter -nomouse -autoboot_script miniGameSetup.lua lastblad
```

Now wait for the demo to start

- MVS: wait through the eyecatcher
- AES: press start during the eyecatcher, or just wait

Instead of the demo starting, the mini game will

## How to play the mini game

- Button A: will exit the mini game back to the cut editor if you don't use the ROM hack
- Button B: kick a life saver
- Button D: reset the level

Navigate Washizuka to the red life saver.
