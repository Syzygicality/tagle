import Tag from "./Tag";

interface TagSectionProps {
  name?: string;
  tags: string[];
  query: boolean;
}

export default function TagSection({ name, tags, query }: TagSectionProps) {
  if (query) {
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag} name={tag} disabled={true} />
        ))}
      </div>
    );
  }
  return (
    <div>
      <h3 className="">{name}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag} name={tag} disabled={false} />
        ))}
      </div>
    </div>
  );
}
