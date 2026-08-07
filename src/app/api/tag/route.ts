import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";
import { htmlEncode } from "@/utils/htmlEncode";
import { XMLParser } from "fast-xml-parser";

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get("name");
    if (!name) throw new Error("No name given.");
    const params = new URLSearchParams({
      user_id: env.userId,
      api_key: env.apiKey,
      name: htmlEncode(name),
      page: "dapi",
      s: "tag",
      q: "index",
    });
    const apiRes = await fetch("https://" + env.apiUrl + `/index.php?${params}`);
    if (!apiRes.ok) throw new Error(`Upstream error: ${apiRes.status}`);
    const xml = await apiRes.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      isArray: (name) => name === "tag",
    });
    // An unknown name comes back as a bare <tag type="array"/> with no results.
    const parsed = parser.parse(xml);
    const matches = parsed?.["tags"]?.["tag"];
    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ error: `No such tag: ${name}` }, { status: 404 });
    }
    const data = matches[0];
    data["type"] = parseInt(data["type"]);
    data["count"] = Number.isFinite(Number(data["count"])) ? Number(data["count"]) : 0;
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(
      `[api/tag] failed for name=${request.nextUrl.searchParams.get("name")}`,
      error instanceof Error ? (error.stack ?? error.message) : error
    );
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
