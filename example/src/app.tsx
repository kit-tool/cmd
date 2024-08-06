import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandFooter,
} from "@/components/command";
import { useState } from "react";
import { groupBy } from "./lib/utils";

const searchMap = [
  { pluginName: "文件搜索", value: "自拍照.jpg", heading: 0 },
  { pluginName: "文件搜索", value: "喜多川.jpg", heading: 0 },
  { pluginName: "文件搜索", value: "柯南.jpg", heading: 0 },
  { pluginName: "文件搜索", value: "柯南2.jpg", heading: 0 },
  { pluginName: "文件搜索", value: "牛逼.jpg", heading: 0 },
  { pluginName: "网页快开", value: "echarts", heading: 0 },
  { pluginName: "网页快开", value: "bilibili", heading: 0 },
  { pluginName: "网页快开", value: "柯南全集", heading: 1 },
  { pluginName: "网页快开", value: "牛逼表情包", heading: 1 },
];

function App() {
  const [search, setSearch] = useState("");
  const [searchGroup, setSearchGroup] = useState({});

  function onSearch(v: string) {
    const searchList = searchMap.filter(
      ({ pluginName, value }) =>
        (!pluginName.indexOf(v) || !value.indexOf(v)) && v
    );
    setSearchGroup(groupBy(searchList, ({ heading }) => heading.toString()));
    setSearch(v);
  }

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Command className="max-w-[800px] max-h-[606px] rounded-lg border shadow-md">
        <CommandInput
          value={search}
          onValueChange={onSearch}
          placeholder="欢迎使用 Kit"
        />
        <CommandList>
          <CommandEmpty>没有搜索结果</CommandEmpty>
          {Object.entries(searchGroup).map(([key, elem]) => (
            <CommandGroup
              key={key}
              heading={key === "0" ? "最佳搜索" : "匹配推荐"}
            >
              {(elem as any[]).map(({ pluginName, value }) => (
                <CommandItem key={pluginName + value}>
                  <span>{pluginName}</span>
                  <span>{value}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <CommandFooter />
      </Command>
    </div>
  );
}

export default App;
