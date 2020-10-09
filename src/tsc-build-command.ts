#!/usr/bin/env node

import {command} from "execa"
import {packages} from "./util"

const main = async ([, , ...args]: string[]) => {
    const pckgs = (await packages()).map(({location}) => location).join(" ")
    const commandToRun = `yarn tsc --build ${args.join(" ")} ${pckgs}`
    console.log(commandToRun)
    command(commandToRun)
}

main(process.argv).catch(console.error)
