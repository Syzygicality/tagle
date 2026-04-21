export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex grow flex-col gap-4">
            <input type="text" placeholder="Add tag here" className="form-control" />
          </div>
          <div className="grid grow-4 grid-cols-3 gap-4"></div>
        </div>
        <div className="grid grid-cols-4 gap-4"></div>
      </div>
    </div>
  );
}
