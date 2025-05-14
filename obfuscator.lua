-- obfuscator.lua
local Hercules = require("Hercules.Hercules")

local inputPath = arg[1]
local outputPath = arg[2]

local inputFile = io.open(inputPath, "r")
local code = inputFile:read("*a")
inputFile:close()

local obfuscated = Hercules:Obfuscate(code)

local outputFile = io.open(outputPath, "w")
outputFile:write(obfuscated)
outputFile:close()
