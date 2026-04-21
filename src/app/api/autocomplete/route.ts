import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";


export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");
    if (!search) throw new Error("Empty search.");
    const params = new URLSearchParams({
      q: search,
    });
    const apiRes = await fetch("https://" + env.apiUrl + `/autocomplete.php?${params}`);
    if (!apiRes.ok) throw new Error(`Upstream error: ${apiRes.status}`)
    const data = await apiRes.json()
    return NextResponse.json(data, {status: 200});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
