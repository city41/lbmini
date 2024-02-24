-- this is the mini game rom hack applied "on the fly"
-- by a mame read tap. This allows trying the hack in mame without
-- bothering to do any actual rom patching

cpu = manager.machine.devices[":maincpu"]
mem = cpu.spaces["program"]
rom_mem = manager.machine.memory.regions[":cslot1:maincpu"]

-- these are the bytes of the patch as emited from `ts-node src/patchRom/main.ts src/patches/forceMiniGame.json`
rom_bytes = {
	-- Force the game to go to cut 1a instead of the demo cut
	[0x64cb6] = 0x30,
	[0x64cb7] = 0x3c,
	[0x64cb8] = 0x0,
	[0x64cb9] = 0x1a,
	-- jsr to 7ffe4
	[0x64cde] = 0x4e,
	[0x64cdf] = 0xb9,
	[0x64ce0] = 0x0,
	[0x64ce1] = 0x7,
	[0x64ce2] = 0xff,
	[0x64ce3] = 0xe4,
	-- Set the bytes the mini game is looking for
	[0x7ffe4] = 0x70,
	[0x7ffe5] = 0x0,
	[0x7ffe6] = 0x2c,
	[0x7ffe7] = 0xa,
	[0x7ffe8] = 0xc,
	[0x7ffe9] = 0x86,
	[0x7ffea] = 0x0,
	[0x7ffeb] = 0x22,
	[0x7ffec] = 0x9a,
	[0x7ffed] = 0x14,
	[0x7ffee] = 0x67,
	[0x7ffef] = 0x0,
	[0x7fff0] = 0x0,
	[0x7fff1] = 0x8,
	[0x7fff2] = 0x30,
	[0x7fff3] = 0x12,
	[0x7fff4] = 0x60,
	[0x7fff5] = 0x0,
	[0x7fff6] = 0x0,
	[0x7fff7] = 0x6,
	[0x7fff8] = 0x30,
	[0x7fff9] = 0x3c,
	[0x7fffa] = 0x15,
	[0x7fffb] = 0x1b,
	[0x7fffc] = 0xe0,
	[0x7fffd] = 0x48,
	[0x7fffe] = 0x4e,
	[0x7ffff] = 0x75,
	-- jsr to 7ffc2
	[0x65160] = 0x4e,
	[0x65161] = 0xb9,
	[0x65162] = 0x0,
	[0x65163] = 0x7,
	[0x65164] = 0xff,
	[0x65165] = 0xc2,
	-- Set the bytes the mini game is looking for
	[0x7ffc2] = 0x2c,
	[0x7ffc3] = 0xa,
	[0x7ffc4] = 0xc,
	[0x7ffc5] = 0x86,
	[0x7ffc6] = 0x0,
	[0x7ffc7] = 0x22,
	[0x7ffc8] = 0x9a,
	[0x7ffc9] = 0x14,
	[0x7ffca] = 0x67,
	[0x7ffcb] = 0x0,
	[0x7ffcc] = 0x0,
	[0x7ffcd] = 0x8,
	[0x7ffce] = 0x30,
	[0x7ffcf] = 0x1a,
	[0x7ffd0] = 0x60,
	[0x7ffd1] = 0x0,
	[0x7ffd2] = 0x0,
	[0x7ffd3] = 0xc,
	[0x7ffd4] = 0x30,
	[0x7ffd5] = 0x3c,
	[0x7ffd6] = 0x15,
	[0x7ffd7] = 0x1b,
	[0x7ffd8] = 0xd5,
	[0x7ffd9] = 0xfc,
	[0x7ffda] = 0x0,
	[0x7ffdb] = 0x0,
	[0x7ffdc] = 0x0,
	[0x7ffdd] = 0x2,
	[0x7ffde] = 0x2,
	[0x7ffdf] = 0x40,
	[0x7ffe0] = 0x0,
	[0x7ffe1] = 0xff,
	[0x7ffe2] = 0x4e,
	[0x7ffe3] = 0x75,
}

start_address = 0x64cb6
end_address = 0x7ffff

function on_rom_read(offset, data, mask)
	if rom_bytes[offset] then
		if mask == 0xffff then
			highByte = rom_bytes[offset]
			lowByte = rom_bytes[offset + 1] or (data & 0xff)
			return (highByte << 8 | lowByte)
		else
			return rom_bytes[offset] or data
		end
	end
end

rom_read_handler = mem:install_read_tap(start_address, end_address, "read", on_rom_read)