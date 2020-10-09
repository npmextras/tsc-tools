#!/usr/bin/env node

import {command} from "execa"
import {existsSync, promises as fs} from "fs"
import {relative} from "path"

const defaultContent = {
    extends: "../../tsconfig.json",
    compilerOptions: {
        rootDir: "./src",
        outDir: "./dist",
    },
    include: ["./src"],
}

interface Package {
    name: string
    location: string
}

interface DependencyGraph {
    [name: string]: string[]
}

const runJsonCommand = async <T = any>(cmd: string) => {
    const {stdout} = await command(cmd)
    return JSON.parse(stdout) as T
}

const main = async () => {
    const [pckgs, dependencyGraph] = await Promise.all([
        runJsonCommand<Package[]>("lerna list --json --all --toposort"),
        runJsonCommand<DependencyGraph>("lerna list --graph --all --toposort"),
    ] as const)

    await Promise.all(
        pckgs.map(async ({location, name}) => {
            const dependencies = dependencyGraph[name]

            const tsconfigPath = `${location}/tsconfig.json`
            const tsconfig = existsSync(tsconfigPath)
                ? JSON.parse((await fs.readFile(tsconfigPath)).toString())
                : defaultContent
            const newTsconfig = {
                ...tsconfig,
                references: dependencies
                    .flatMap(dependent => {
                        const dependentLocation = pckgs.find(
                            ({name}) => name === dependent,
                        )?.location
                        if (!dependentLocation) {
                            return []
                        }

                        return [
                            {
                                path: relative(location, dependentLocation),
                            },
                        ]
                    })
                    .filter(({path}) => path !== ""),
            }
            await fs.writeFile(
                tsconfigPath,
                JSON.stringify(newTsconfig, undefined, 4),
            )
        }),
    )
}

main().catch(console.error)
