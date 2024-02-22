cpu = manager.machine.devices[":maincpu"]
mem = cpu.spaces["program"]
screen = manager.machine.screens[":screen"]

debug_dips_address = 0x10ec00

function on_debug_dip_write(offset, data)
	if offset == debug_dips_address then
		-- turn on debug dip 1-8
		return 0x8000
	end
end

debug_dip_write_handler = mem:install_write_tap(debug_dips_address, debug_dips_address + 1, "write", on_debug_dip_write)

bank2_address = 0x229a14

function on_bank2_read(offset, data)
	if offset == bank2_address then
		return 0x151b
	end
end

bank2_read_handler = mem:install_read_tap(bank2_address, bank2_address + 1, "read", on_bank2_read)
