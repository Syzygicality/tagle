import { Category } from "@/hooks/useTagle";

interface TagProps {
  name: string;
  type: "category" | "search" | "query";
  category?: Category;
  tagOnClick?: (arg0: string) => void;
  tagOnDblClick?: (arg0: Category, arg1: string) => void;
}

export default function Tag({ name, type, category, tagOnClick, tagOnDblClick }: TagProps) {
  const tags = {
    "category": (
      <button
        className=""
        onClick={(e) => tagOnClick!(name)}
        onDoubleClick={(e) => tagOnDblClick!(category!, name)}
      >
        {name}
      </button>
    ),
    "search": (
      <button
        className=""
        onClick={(e) => tagOnClick!(name)}
      >
        {name}
      </button>
    ),
    "query": (
      <button
        className=""
        disabled
      >
        {name}
      </button>
    ),
  }
  
  return tags[type]
}
