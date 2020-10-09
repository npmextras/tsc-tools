#!/usr/bin/env node

import {promises as fs} from "fs"
import {packages} from "./util"

const createPaths = async () =>
    (await packages())
        .map(({location, name}) => [name, [`${location}/src`]] as const)
        .reduce((acc, [key, value]) => ({...acc, [key]: value}), {})

const main = async () => {
    await fs.writeFile(
        "./tsconfig.json",
        JSON.stringify(
            {
                extends: "./tsconfig.base.json",
                compilerOptions: {
                    baseUrl: ".",
                    paths: await createPaths(),
                },
            },
            undefined,
            4,
        ),
    )
}

main().catch(console.error)
