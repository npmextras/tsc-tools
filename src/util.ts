import {command} from "execa"
import path from "path"
import {promises as fs} from "fs"

export interface Package {
    name: string
    location: string
}

export const packages = async (
    relativePaths = true,
    root = false,
): Promise<Package[]> => {
    const [{stdout}, {stdout: yarnInfo}] = await Promise.all([
        command(`lerna list --json`),
        command(`yarn info`),
    ])
    return [
        ...(root ? [{location: ".", name: JSON.parse(yarnInfo).name}] : []),
        JSON.parse(stdout).map((json: any) => ({
            ...json,
            location: relativePaths
                ? path.relative(".", json.location)
                : json.location,
        })),
    ]
}

export interface PackageJson {
    $package: Package
    dependencies?: object
    devDependencies?: object
    optionalDependencies?: object
}

export const packageJsons = async (
    relativePaths = true,
    root = false,
): Promise<PackageJson[]> =>
    await Promise.all(
        (await packages(relativePaths, root)).map(async $package => ({
            $package,
            ...JSON.parse(
                (
                    await fs.readFile(`${$package.location}/package.json`)
                ).toString(),
            ),
        })),
    )
