import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";
import { XMLParser } from "fast-xml-parser";

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get("name");
    if (!name) throw new Error("No name given.");
    const params = new URLSearchParams({
      user_id: env.userId,
      api_key: env.apiKey,
      name: name,
      page: "dapi",
      s: "tag",
      q: "index"
    });
    const apiRes = await fetch("https://" + env.apiUrl + `/index.php?${params}`);
    if (!apiRes.ok) throw new Error(`Upstream error: ${apiRes.status}`);
    const xml = await apiRes.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      isArray: (name) => name === "tag",
    })
    const data = parser.parse(xml);
    return NextResponse.json(data["tags"]["tag"][0], {status: 200});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
