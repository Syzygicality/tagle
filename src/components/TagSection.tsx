import Tag from "./Tag";
import { Category } from "@/hooks/useTagle";

interface TagSectionProps {
  name?: string;
  tags: string[];
  query: boolean;
  tagOnClick?: (arg0: string) => void;
  tagOnDblClick?: (arg0: Category, arg1: string) => void;
}

export default function TagSection({
  name,
  tags,
  query,
  tagOnClick,
  tagOnDblClick,
}: TagSectionProps) {
  if (query) {
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag} name={tag} type={"query"} />
        ))}
      </div>
    );
  }
  return (
    <div>
      <h3 className="">{name}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag}
            name={tag}
            type={"category"}
            category={name!.toLowerCase() as Category}
            tagOnClick={tagOnClick}
            tagOnDblClick={tagOnDblClick}
          />
        ))}
      </div>
    </div>
  );
}
