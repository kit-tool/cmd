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
import { groupBy } from "./lib/utils";
import { Calculator } from "lucide-react";

type SearchItem = {
  /** 主要标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 值 */
  value: string;
  /** 数据类型 */
  type: string;
  /** 列表图标 */
  icon: string;
};

const suggestionsSearchList: SearchItem[] = [];

const recommendSearchList: SearchItem[] = [];

const searchMap = [
  { pluginName: "文件搜索", value: "自拍照.jpg" },
  { pluginName: "文件搜索", value: "喜多川.jpg" },
  { pluginName: "文件搜索", value: "柯南.jpg" },
  { pluginName: "文件搜索", value: "柯南2.jpg" },
  { pluginName: "文件搜索", value: "牛逼.jpg" },
  { pluginName: "网页快开", value: "echarts" },
  { pluginName: "网页快开", value: "bilibili" },
  { pluginName: "网页快开", value: "柯南全集" },
  { pluginName: "网页快开", value: "牛逼表情包" },
];

function App() {
  const [search, setSearch] = useState("");
  const [searchGroup, setSearchGroup] = useState<typeof searchMap>([]);

  function onSearch(v: string) {
    const searchList = searchMap.filter(
      ({ pluginName, value }) =>
        (!pluginName.indexOf(v) || !value.indexOf(v)) && v
    );
    setSearchGroup(searchList);
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
          {/* {Object.entries(searchGroup).map(([key, elem]) => (
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
          ))} */}
          <CommandGroup heading="最佳搜索">
            <CommandItem>
              <CommandIcon>
                <Calculator className="max-h-5 max-w-5" />
              </CommandIcon>
              文字1
              <span>文字</span>
            </CommandItem>
            {searchGroup.map((item) => (
              <CommandItem key={item.pluginName + item.value}>
                {item.pluginName}
                <span>{item.value}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="匹配推荐"></CommandGroup>
        </CommandList>
        <CommandFooter />
      </Command>
    </div>
  );
}

export default App;
