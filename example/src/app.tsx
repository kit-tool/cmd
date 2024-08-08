import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandIcon,
  CommandSeparator,
  CommandFooter,
} from "@/components/command";
import { useState } from "react";
import { Smile } from "lucide-react";

type SearchItem = {
  /** 主要标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 值 */
  value: string;
  /** 列表图标 */
  icon: string;
};

const suggestionsSearchList: SearchItem[] = [
  {
    title: "好看的.jpg",
    subtitle: "文件搜索",
    value: "0",
    icon: "",
  },
  {
    title: "喜多川.png",
    subtitle: "文件搜索",
    value: "1",
    icon: "",
  },
  {
    title: "柯南.jpg",
    subtitle: "文件搜索",
    value: "2",
    icon: "",
  },
  {
    title: "大黑鱼.png",
    subtitle: "文件搜索",
    value: "3",
    icon: "",
  },
  {
    title: "喜多川海梦.jpg",
    subtitle: "文件搜索",
    value: "4",
    icon: "",
  },
  {
    title: "IDEA",
    subtitle: "应用搜索",
    value: "5",
    icon: "",
  },
  {
    title: "有道词典",
    subtitle: "应用搜索",
    value: "6",
    icon: "",
  },
];

const recommendSearchList: SearchItem[] = [
  {
    title: "设置",
    subtitle: "插件",
    value: "7",
    icon: "",
  },
  {
    title: "插件市场",
    subtitle: "插件",
    value: "8",
    icon: "",
  },
];

function App() {
  const [search, setSearch] = useState("");
  const [suggestionsResult, setSuggestionsResult] = useState<SearchItem[]>([]);

  function onSearch(v: string) {
    const searchResult = suggestionsSearchList.filter(
      ({ title, subtitle }) => (!title.indexOf(v) || !subtitle.indexOf(v)) && v
    );
    setSuggestionsResult(searchResult);
    setSearch(v);
  }

  function getDimensions(value: any) {
    console.log(value);
  }

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Command
        loop
        className="max-w-[800px] max-h-[606px] rounded-lg border shadow-md"
      >
        <CommandInput
          autoFocus
          value={search}
          onValueChange={onSearch}
          placeholder="欢迎使用 Kit"
        />
        <CommandList onDimensions={getDimensions}>
          <CommandEmpty>没有搜索结果</CommandEmpty>
          <CommandGroup heading="最佳搜索">
            {suggestionsResult.map((item) => (
              <CommandItem key={item.value}>
                <CommandIcon>
                  <Smile className="max-h-5 max-w-5" />
                </CommandIcon>
                {item.title}
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                  {item.subtitle}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="匹配推荐">
            {recommendSearchList.map((item) => (
              <CommandItem key={item.value}>
                <CommandIcon>
                  <Smile className="max-h-5 max-w-5" />
                </CommandIcon>
                {item.title}
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                  {item.subtitle}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <CommandFooter />
      </Command>
    </div>
  );
}

export default App;
