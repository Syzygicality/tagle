import { NextRequest, NextResponse } from "next/server";
import { env } from "@/utils/env";

const MAX_ITEMS = 6;

type AutocompleteItem = {
  count?: number;
  label: string;
  value: string;
};

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");
    if (!search) throw new Error("Empty search.");
    const params = new URLSearchParams({
      q: search,
    });
    const apiRes = await fetch("https://" + env.apiUrl + `/autocomplete.php?${params}`);
    if (!apiRes.ok) throw new Error(`Upstream error: ${apiRes.status}`);
    const data: AutocompleteItem[] = await apiRes.json();

    data
      .map(
        (obj) =>
          (obj.count = Number(
            obj.label.slice(obj.label.lastIndexOf("(") + 1, obj.label.lastIndexOf(")"))
          ))
      )
      .splice(0, Math.min(data.length, MAX_ITEMS));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
