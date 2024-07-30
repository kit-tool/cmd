import { Command, CommandInput } from "@/components/command";

function App() {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Command className="max-w-[800px] max-h-[506px] rounded-lg border shadow-md">
        <CommandInput placeholder="欢迎使用 Kit" />
      </Command>
    </div>
  );
}

export default App;
