import {
  Command,
  CommandInput,
  CommandList,
  CommandFooter,
} from "@/components/command";

function App() {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Command className="max-w-[800px] max-h-[606px] rounded-lg border shadow-md">
        <CommandInput placeholder="欢迎使用 Kit" />
        <CommandList>文字</CommandList>
        <CommandFooter />
      </Command>
    </div>
  );
}

export default App;
