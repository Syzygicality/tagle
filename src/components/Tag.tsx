interface TagProps {
  name: string;
  disabled: boolean;
}

export default function Tag({ name, disabled }: TagProps) {
  return (
    <button className="" disabled={disabled}>
      {name}
    </button>
  );
}
