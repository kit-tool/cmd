import { Primitive } from "@radix-ui/react-primitive";
import * as React from "react";
import { useId } from "@radix-ui/react-id";

type Children = { children?: React.ReactNode };
type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

type EmptyProps = Children & DivProps & {};
type SeparatorProps = DivProps & {
  alwaysRender?: boolean;
};

type FooterProps = Children & DivProps & {};

type CommandProps = Children &
  DivProps & {
    label?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    loop?: boolean;
    disablePointerSelection?: boolean;
  };

type ListProps = Children &
  DivProps & {
    label?: string;
    /**
     * 是否一直显示此元素
     */
    alwaysRender?: boolean;
  };

type ViewProps = Children &
  DivProps & {
    /**
     * 是否一直显示此元素
     */
    alwaysRender?: boolean;
  };

type ItemProps = Children &
  Omit<DivProps, "disabled" | "onSelect" | "value"> & {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    value?: string;
    view?: string;
  };

type GroupProps = Children &
  Omit<DivProps, "heading" | "value"> & {
    heading?: React.ReactNode;
    value?: string;
  };

type InputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Primitive.input>,
  "value" | "onChange" | "type"
> & {
  value?: string;
  onValueChange?: (search: string) => void;
};

type Context = {
  value: (id: string, value: string) => void;
  item: (id: string, groupId: string) => () => void;
  group: (id: string) => () => void;
  label: string;
  disablePointerSelection: boolean;
  // Ids
  viewId: string;
  listId: string;
  labelId: string;
  inputId: string;
  // Refs
  listInnerRef: React.RefObject<HTMLDivElement | null>;
};

type State = {
  search: string;
  value: string;
  view: string | null;
  record: {
    count: number;
    groups: Map<string, number>;
  };
};

type Store = {
  subscribe: (callback: () => void) => () => void;
  snapshot: () => State;
  setState: <K extends keyof State>(
    key: K,
    value: State[K],
    opts?: any
  ) => void;
  emit: () => void;
};

type Group = {
  id: string;
};

const GROUP_SELECTOR = `[kit-cmd-group=""]`;
const ITEM_SELECTOR = `[kit-cmd-item=""]`;
const GROUP_HEADING_SELECTOR = `[kit-cmd-group-heading=""]`;
const VALID_ITEM_SELECTOR = `${ITEM_SELECTOR}:not([aria-disabled="true"])`;
const SELECT_EVENT = `kit-cmd-item-select`;
const VALUE_ATTR = `data-value`;

const CommandContext = React.createContext<Context | undefined>(undefined);
const useCommand = () => React.useContext(CommandContext);

const StoreContext = React.createContext<Store | undefined>(undefined);
const useStore = () => React.useContext(StoreContext);

const GroupContext = React.createContext<Group | undefined>(undefined);

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  (props, forwardedRef) => {
    const listeners = useLazyRef<Set<() => void>>(() => new Set());
    const state = useLazyRef<State>(() => ({
      search: "",
      value: "",
      view: null,
      record: {
        count: 0,
        groups: new Map(),
      },
    }));

    const allItems = useLazyRef<Set<string>>(() => new Set()); // [...itemIds]
    const allGroups = useLazyRef<Map<string, Set<string>>>(() => new Map()); // groupId → [...itemIds]
    const ids = useLazyRef<Map<string, { value: string }>>(() => new Map());
    const propsRef = useAsRef(props);

    const {
      label,
      children,
      value,
      onValueChange,
      loop,
      disablePointerSelection = false,
      ...etc
    } = props;

    const viewId = useId();
    const listId = useId();
    const labelId = useId();
    const inputId = useId();

    const listInnerRef = React.useRef<HTMLDivElement>(null);

    const schedule = useScheduleLayoutEffect();

    const store: Store = React.useMemo(() => {
      return {
        subscribe: (cb) => {
          listeners.current.add(cb);
          return () => listeners.current.delete(cb);
        },
        snapshot: () => {
          return state.current;
        },
        setState: (key, value, opts) => {
          if (Object.is(state.current[key], value)) return;
          state.current[key] = value;

          if (key === "search") {
            countRecord();
            schedule(1, selectFirstItem);
          } else if (key === "value") {
            if (!opts) {
              // Scroll the selected item into view
              schedule(5, scrollSelectedIntoView);
            }
            if (propsRef.current?.value !== undefined) {
              // If controlled, just call the callback instead of updating state internally
              const newValue = (value ?? "") as string;
              propsRef.current.onValueChange?.(newValue);
              return;
            }
          }

          // Notify subscribers that state has changed
          store.emit();
        },
        emit: () => {
          listeners.current.forEach((l) => l());
        },
      };
    }, []);

    const context: Context = React.useMemo(
      () => ({
        value: (id, value) => {
          if (value !== ids.current.get(id)?.value) {
            ids.current.set(id, { value });
            schedule(2, () => {
              // sort()
              store.emit();
            });
          }
        },
        item: (id, groupId) => {
          allItems.current.add(id);

          if (groupId) {
            if (!allGroups.current.has(groupId)) {
              allGroups.current.set(groupId, new Set([id]));
            } else {
              allGroups.current.get(groupId)!.add(id);
            }
          }

          schedule(3, () => {
            countRecord();

            if (!state.current.value) {
              selectFirstItem();
            }

            store.emit();
          });

          return () => {
            ids.current.delete(id);
            allItems.current.delete(id);
            const selectedItem = getSelectedItem();

            schedule(4, () => {
              countRecord();
              // The item removed have been the selected one,
              // so selection should be moved to the first
              if (selectedItem?.getAttribute("id") === id) selectFirstItem();

              store.emit();
            });
          };
        },
        group: (id) => {
          // 把新增的 groupId 添加到 allGroups
          if (!allGroups.current.has(id)) {
            allGroups.current.set(id, new Set());
          }

          return () => {
            ids.current.delete(id);
            allGroups.current.delete(id);
          };
        },
        label: label || props["aria-label"] || "",
        disablePointerSelection,
        viewId,
        listId,
        inputId,
        labelId,
        listInnerRef,
      }),
      []
    );

    /**
     * 获取第一个 Item 选项的值
     */
    function selectFirstItem() {
      // 过滤 Item 列表不为禁用的第一个 DOM
      const item = getValidItems().find(
        (item) => item.getAttribute("aria-disabled") !== "true"
      );
      // 获取第一个选项的value值
      const value = item?.getAttribute(VALUE_ATTR);
      store.setState("value", value || "");
    }

    /**
     * 获取 item 数量
     */
    function countRecord() {
      state.current.record.count = allItems.current.size;

      for (const [groupId, group] of allGroups.current) {
        state.current.record.groups.set(groupId, group.size);
      }
    }

    function scrollSelectedIntoView() {
      const item = getSelectedItem();

      if (item) {
        if (item.parentElement?.firstChild === item) {
          // First item in Group, ensure heading is in view
          item
            .closest(GROUP_SELECTOR)
            ?.querySelector(GROUP_HEADING_SELECTOR)
            ?.scrollIntoView({ block: "nearest" });
        }

        // Ensure the item is always in view
        item.scrollIntoView({ block: "nearest" });
      }
    }

    /**
     * 获取选中 Item DOM
     * @returns
     */
    function getSelectedItem() {
      return listInnerRef.current?.querySelector(
        `${ITEM_SELECTOR}[aria-selected="true"]`
      );
    }

    /**
     * 选择没有禁用的 Item DOM
     * @returns 选中的 DOM
     */
    function getValidItems() {
      return Array.from(
        listInnerRef.current?.querySelectorAll(VALID_ITEM_SELECTOR) || []
      );
    }

    function updateSelectedToIndex(index: number) {
      const items = getValidItems();
      const item = items[index];
      if (item) store.setState("value", item.getAttribute(VALUE_ATTR)!);
    }

    /**
     * 更新选中的 Item
     * @param change
     */
    function updateSelectedByItem(change: 1 | -1) {
      const selected = getSelectedItem();
      const items = getValidItems();
      const index = items.findIndex((item) => item === selected);

      let newSelected = items[index + change];

      if (propsRef.current?.loop)
        newSelected = items[(index + change + items.length) % items.length];

      if (newSelected)
        store.setState("value", newSelected.getAttribute(VALUE_ATTR)!);
    }

    /**
     * 更新选中的 Group
     * @param change
     */
    function updateSelectedByGroup(change: 1 | -1) {
      const selected = getSelectedItem();
      let group = selected?.closest(GROUP_SELECTOR);
      let item: HTMLElement | null | undefined;

      // 循环查询相邻元素
      while (group && !item) {
        group =
          change > 0
            ? findNextSibling(group, GROUP_SELECTOR)
            : findPreviousSibling(group, GROUP_SELECTOR);
        item = group?.querySelector(VALID_ITEM_SELECTOR);
      }

      if (item) {
        store.setState("value", item.getAttribute(VALUE_ATTR)!);
      } else {
        updateSelectedByItem(change);
      }
    }

    const last = () => updateSelectedToIndex(getValidItems().length - 1);

    /**
     * 选中下一个 Item
     * @param e
     */
    const next = (e: React.KeyboardEvent) => {
      e.preventDefault();

      if (e.altKey) {
        updateSelectedByGroup(1);
      } else {
        updateSelectedByItem(1);
      }
    };

    /**
     * 选中上一个 Item
     * @param e
     */
    const prev = (e: React.KeyboardEvent) => {
      e.preventDefault();

      if (e.altKey) {
        updateSelectedByGroup(-1);
      } else {
        updateSelectedByItem(-1);
      }
    };

    /**
     * 按键事件处理
     * @param e
     */
    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      etc.onKeyDown?.(e);

      if (!e.defaultPrevented) {
        switch (e.key) {
          case "ArrowDown": {
            next(e);
            break;
          }
          case "ArrowUp": {
            prev(e);
            break;
          }
          case "Home": {
            // First item
            e.preventDefault();
            updateSelectedToIndex(0);
            break;
          }
          case "End": {
            // Last item
            e.preventDefault();
            last();
            break;
          }
          case "Enter": {
            // Check if IME composition is finished before triggering onSelect
            // This prevents unwanted triggering while user is still inputting text with IME
            // e.keyCode === 229 is for the Japanese IME and Safari.
            // isComposing does not work with Japanese IME and Safari combination.
            if (!e.nativeEvent.isComposing && e.keyCode !== 229) {
              // Trigger item onSelect
              e.preventDefault();
              const item = getSelectedItem();
              if (item) {
                const event = new Event(SELECT_EVENT);
                item.dispatchEvent(event);
              }
            }
          }
        }
      }
    }

    return (
      <Primitive.div
        ref={forwardedRef}
        tabIndex={-1}
        {...etc}
        kit-cmd-root=""
        onKeyDown={onKeyDown}
      >
        {SlottableWithNestedChildren(props, (child) => (
          <StoreContext.Provider value={store}>
            <CommandContext.Provider value={context}>
              {child}
            </CommandContext.Provider>
          </StoreContext.Provider>
        ))}
      </Primitive.div>
    );
  }
);

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  (props, forwardedRef) => {
    const id = useId();
    const ref = React.useRef<HTMLDivElement>(null);
    const groupContext = React.useContext(GroupContext);
    const context = useCommand();
    const propsRef = useAsRef(props);

    useLayoutEffect(() => {
      return context!.item(id, groupContext!.id);
    }, []);

    const value = useValue(id, ref, [props.value, props.children, ref]);

    const store = useStore();
    const selected = useCmd(
      (state) => state.value && state.value === value.current
    );

    React.useEffect(() => {
      const element = ref.current;
      if (!element || props.disabled) return;
      element.addEventListener(SELECT_EVENT, onSelect);
      return () => element.removeEventListener(SELECT_EVENT, onSelect);
    }, [props.onSelect, props.disabled]);

    function onSelect() {
      select();
      propsRef.current.onSelect?.(value.current!);
    }

    /**
     * 把选中的值传给value
     */
    function select() {
      store!.setState("value", value.current!, true);
    }

    const { disabled, value: _, onSelect: __, ...etc } = props;

    return (
      <Primitive.div
        ref={mergeRefs([ref, forwardedRef])}
        {...etc}
        id={id}
        kit-cmd-item=""
        role="option"
        aria-disabled={Boolean(disabled)}
        aria-selected={Boolean(selected)}
        data-disabled={Boolean(disabled)}
        data-selected={Boolean(selected)}
        onPointerMove={
          disabled || context?.disablePointerSelection ? undefined : select
        }
        onClick={disabled ? undefined : onSelect}
      >
        {props.children}
      </Primitive.div>
    );
  }
);

const Group = React.forwardRef<HTMLDivElement, GroupProps>(
  (props, forwardedRef) => {
    const { heading, children, ...etc } = props;
    const id = useId();
    const ref = React.useRef<HTMLDivElement>(null);
    const headingRef = React.useRef<HTMLDivElement>(null);
    const headingId = useId();
    const context = useCommand();
    const render = useCmd((state) => !Boolean(state.record.groups.get(id)));

    useLayoutEffect(() => {
      return context!.group(id);
    }, []);

    useValue(id, ref, [props.value, props.heading, headingRef]);

    const contextValue = React.useMemo(() => ({ id }), []);

    // if (render) return null;

    return (
      <Primitive.div
        ref={mergeRefs([ref, forwardedRef])}
        {...etc}
        kit-cmd-group=""
        role="presentation"
        hidden={render}
      >
        {heading && (
          <div
            ref={headingRef}
            aria-hidden
            kit-cmd-group-heading=""
            id={headingId}
          >
            {heading}
          </div>
        )}
        {SlottableWithNestedChildren(props, (child) => (
          <div
            kit-cmd-group-items=""
            role="group"
            aria-labelledby={heading ? headingId : undefined}
          >
            <GroupContext.Provider value={contextValue}>
              {child}
            </GroupContext.Provider>
          </div>
        ))}
      </Primitive.div>
    );
  }
);

/**
 * Item 或 Group 之间使用的分隔
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (props, forwardedRef) => {
    const { alwaysRender, ...etc } = props;
    const render = useCmd((state) => !state.search);

    if (!alwaysRender && !render) return null;
    return <Primitive.div ref={forwardedRef} {...etc} kit-cmd-separator="" />;
  }
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, forwardedRef) => {
    const { onValueChange, ...etc } = props;
    const isControlled = props.value != null;
    const store = useStore();
    const search = useCmd((state) => state.search);
    const value = useCmd((state) => state.value);
    const context = useCommand();

    const selectedItemId = React.useMemo(() => {
      const item = context!.listInnerRef.current?.querySelector(
        `${ITEM_SELECTOR}[${VALUE_ATTR}="${encodeURIComponent(value)}"]`
      );
      return item?.getAttribute("id");
    }, []);

    return (
      <Primitive.input
        ref={forwardedRef}
        {...etc}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-autocomplete="list"
        role="combobox"
        aria-expanded={true}
        aria-controls={context!.listId}
        aria-labelledby={context!.labelId}
        aria-activedescendant={selectedItemId || ""}
        id={context!.inputId}
        type="text"
        value={isControlled ? props.value : search}
        onChange={(e) => {
          // if (!isControlled) {
          //   store!.setState("search", e.target.value);
          // }
          store!.setState("search", e.target.value);
          onValueChange?.(e.target.value);
        }}
      />
    );
  }
);

const List = React.forwardRef<HTMLDivElement, ListProps>(
  (props, forwardedRef) => {
    const { children, label = "Suggestions", ...etc } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    const height = React.useRef<HTMLDivElement>(null);
    const context = useCommand();
    const propsRef = useAsRef(props);

    React.useEffect(() => {
      if (height.current && ref.current) {
        const el = height.current;
        const wrapper = ref.current;
        let animationFrame: number;
        const observer = new ResizeObserver(() => {
          animationFrame = requestAnimationFrame(() => {
            const height = el.offsetHeight;
            wrapper.style.setProperty(
              `--kit-cmd-list-height`,
              height.toFixed(1) + "px"
            );
          });
        });
        observer.observe(el);
        return () => {
          cancelAnimationFrame(animationFrame);
          observer.unobserve(el);
        };
      }
    }, []);

    // 是否显示当前 List
    const render = useCmd((state) =>
      propsRef.current.alwaysRender ? true : !state.search && !state.view
    );

    if (render) return null;

    return (
      <Primitive.div
        ref={mergeRefs([ref, forwardedRef])}
        {...etc}
        kit-cmd-list=""
        role="listbox"
        aria-label={label}
        // hidden={render}
      >
        {SlottableWithNestedChildren(props, (child) => (
          <div
            ref={mergeRefs([height, context!.listInnerRef])}
            kit-cmd-list-sizer=""
          >
            {child}
          </div>
        ))}
      </Primitive.div>
    );
  }
);

const View = React.forwardRef<HTMLDivElement, ViewProps>(
  (props, forwardedRef) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const propsRef = useAsRef(props);

    // 是否显示当前 List
    const render = useCmd((state) =>
      propsRef.current.alwaysRender ? true : Boolean(state.view)
    );

    if (render) return null;

    return (
      <Primitive.div
        ref={mergeRefs([ref, forwardedRef])}
        {...props}
        kit-cmd-view=""
        // hidden={render}
      >
        {SlottableWithNestedChildren(props, (child) => (
          <div kit-cmd-view-sizer="" role="region">
            {child}
          </div>
        ))}
      </Primitive.div>
    );
  }
);

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  (props, forwardedRef) => {
    const render = useCmd((state) => state.record.count !== 0);

    if (render) return null;
    return <Primitive.div ref={forwardedRef} {...props} kit-cmd-empty="" />;
  }
);

const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  (props, forwardedRef) => {
    return <Primitive.div ref={forwardedRef} {...props} kit-cmd-footer="" />;
  }
);

const pkg = Object.assign(Command, {
  View,
  List,
  Item,
  Input,
  Group,
  Separator,
  Empty,
  Footer,
});

export { pkg as Command };

export { Command as CommandRoot };
export { View as CommandView };
export { List as CommandList };
export { Item as CommandItem };
export { Input as CommandInput };
export { Group as CommandGroup };
export { Separator as CommandSeparator };
export { Empty as CommandEmpty };
export { Footer as CommandFooter };

/**
 * 查找指定元素的下一个符合给定选择器的兄弟元素
 * @param el 指定元素
 * @param selector 给定选择器
 * @returns 查找到的元素
 */
function findNextSibling(el: Element, selector: string) {
  let sibling = el.nextElementSibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.nextElementSibling;
  }
}

/**
 * 查找指定元素的上一个符合给定选择器的兄弟元素
 * @param el 指定元素
 * @param selector 给定选择器
 * @returns 查找到的元素
 */
function findPreviousSibling(el: Element, selector: string) {
  let sibling = el.previousElementSibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.previousElementSibling;
  }
}

function useAsRef<T>(data: T) {
  const ref = React.useRef<T>(data);

  useLayoutEffect(() => {
    ref.current = data;
  });

  return ref;
}

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function useLazyRef<T>(fn: () => T) {
  const ref = React.useRef<T>();

  if (ref.current === undefined) {
    ref.current = fn();
  }

  return ref as React.MutableRefObject<T>;
}

function useCmd<T = any>(selector: (state: State) => T) {
  const store = useStore();
  const cb = () => selector(store!.snapshot());
  return React.useSyncExternalStore(store!.subscribe, cb, cb);
}

function useValue(
  id: string,
  ref: React.RefObject<HTMLElement>,
  deps: (string | React.ReactNode | React.RefObject<HTMLElement>)[]
) {
  const valueRef = React.useRef<string>();
  const context = useCommand();

  useLayoutEffect(() => {
    const value = (() => {
      for (const part of deps) {
        if (typeof part === "string") {
          return part.trim();
        }

        if (typeof part === "object" && "current" in part!) {
          if (part.current) {
            return part.current.textContent?.trim() || "";
          }
          return valueRef.current || "";
        }
      }
      return "";
    })();

    context!.value(id, value);
    ref.current?.setAttribute(VALUE_ATTR, value);
    valueRef.current = value;
  });

  return valueRef;
}

function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

const useScheduleLayoutEffect = () => {
  const [s, ss] = React.useState<object>();
  const fns = useLazyRef(() => new Map<string | number, () => void>());

  useLayoutEffect(() => {
    fns.current.forEach((f) => f());
    fns.current = new Map();
  }, [s]);

  return (id: string | number, cb: () => void) => {
    fns.current.set(id, cb);
    ss({});
  };
};

function renderChildren(children: React.ReactElement) {
  const childrenType = children.type as any;
  // The children is a component
  if (typeof childrenType === "function") return childrenType(children.props);
  // The children is a component with `forwardRef`
  else if ("render" in childrenType) return childrenType.render(children.props);
  // It's a string, boolean, etc.
  else return children;
}

function SlottableWithNestedChildren(
  { asChild, children }: { asChild?: boolean; children?: React.ReactNode },
  render: (child: React.ReactNode) => JSX.Element
) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      renderChildren(children),
      { ref: (children as any).ref },
      render(children.props.children)
    );
  }
  return render(children);
}
