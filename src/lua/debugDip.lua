cpu = manager.machine.devices[":maincpu"]
mem = cpu.spaces["program"]
screen = manager.machine.screens[":screen"]

address = 0x10ec00

function on_write(offset, data)
	print(string.format("on_write at: %x, %x", offset, data))
	if offset == address then
		return 0x200
	end
end

write_handler = mem:install_write_tap(address, address + 1, "write", on_write)
