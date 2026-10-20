import { writeFile } from "node:fs/promises"
import { readProjectStills } from "../lib/projects/read-stills"

async function main() {
  const stills = await readProjectStills()
  await writeFile("lib/projects/stills-manifest.json", JSON.stringify(stills, null, 2) + "\n")
  console.log(`Generated gallery index for ${Object.keys(stills).length} projects`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
