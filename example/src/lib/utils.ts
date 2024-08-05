import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function groupBy<T = any>(array: T[], cb: (o: T) => string) {
  return array.reduce((result, currentValue) => {
    // 获取分组键
    const key = cb(currentValue);

    // 如果结果对象中没有这个键，则初始化一个空数组
    if (!result[key]) {
      result[key] = [];
    }

    // 将当前对象推入对应的分组数组中
    result[key].push(currentValue);

    return result;
  }, {} as { [key in string]: T[] });
}
