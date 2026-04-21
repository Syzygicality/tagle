import TagSection from "@/components/TagSection";

export default function Home() {
  return (
    <div className="flex min-h-screen min-w-full flex-col items-center gap-4 bg-white p-4">
      <h1 className="">Tagle</h1>
      <div className="flex w-full gap-4">
        <div className="flex grow flex-col gap-4">
          <input type="text" placeholder="Register tags here" className="" />
          <input type="text" placeholder="Selected tags will appear here" className="" disabled />
        </div>
        <div className="grid grow-4 grid-cols-3 gap-4">
          <TagSection name="Copyright" tags={[]} query={false} />
          <TagSection name="Characters" tags={[]} query={false} />
          <TagSection name="Artists" tags={[]} query={false} />
          <TagSection name="General" tags={[]} query={false} />
          <TagSection name="Meta" tags={[]} query={false} />
          <TagSection name="Other" tags={[]} query={false} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4"></div>
    </div>
  );
}
