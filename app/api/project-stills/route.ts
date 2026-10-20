import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { STILLS_FOLDERS } from "@/lib/projects/stills-folders"
import { NextResponse } from "next/server"
export const runtime = "nodejs"
// Publish the gallery index at build time. Media stays on the CDN instead of
// being bundled into a serverless function with every filesystem lookup.
export const dynamic = "force-static"

async function readImages(slug: string, folder = "") {
  const relative = `projects/${slug}/stills${folder ? `/${folder}` : ""}`
  const directory = path.join(process.cwd(), "public", relative)
  let names: string[] = []
  try { names = await readdir(directory) } catch { return [] }
  let crops: Record<string,string> = {}
  try { crops = JSON.parse(await readFile(path.join(directory,"crops.json"),"utf8")) } catch {}
  return names.filter(name => (folder === "postcards" ? /\.(mp4|webm|m4v)$/i : /\.(jpe?g|png|webp|avif)$/i).test(name)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map((name,index)=>({kind:folder === "postcards" ? "video" : "image",src:`/${relative}/${encodeURIComponent(name)}`,alt:`${slug.replace(/-/g," ")} film still ${index+1}`,width:1600,height:900,focalPoint:typeof crops[name]==="string" ? crops[name] : "50% 50%"}))
}

export async function GET() {
  const entries = await Promise.all(Object.values(STILLS_FOLDERS).map(async slug => {
    const [preview, gallery, legacy, postcards] = await Promise.all([readImages(slug,"preview"),readImages(slug,"gallery"),readImages(slug), ["neogenesis", "second-sight-ventures-42", "determinant-materials-27", "zoltux-23"].includes(slug) ? readImages(slug,"postcards") : Promise.resolve([])])
    return [slug, {preview:preview.length ? preview.slice(0,9) : legacy.slice(0,9), gallery:gallery.length ? gallery : legacy, postcards}] as const
  }))
  return NextResponse.json(Object.fromEntries(entries), {headers:{"Cache-Control":"no-store"}})
}
