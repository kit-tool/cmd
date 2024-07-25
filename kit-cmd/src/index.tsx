import { Primitive } from "@radix-ui/react-primitive";
import * as React from "react";
import { useId } from "@radix-ui/react-id";

type Children = { children?: React.ReactNode };
type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

type CommandProps = Children &
  DivProps & {
    label?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    disablePointerSelection?: boolean;
  };

type ItemProps = Children &
  Omit<DivProps, "disabled" | "onSelect" | "value"> & {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    value?: string;
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
  listId: string;
  labelId: string;
  inputId: string;
  // Refs
  listInnerRef: React.RefObject<HTMLDivElement | null>;
};

type State = {
  search: string;
  value: string;
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

const ITEM_SELECTOR = `[kit-cmd-item=""]`;
const VALID_ITEM_SELECTOR = `${ITEM_SELECTOR}:not([aria-disabled="true"])`;
const SELECT_EVENT = `kit-cmd-item-select`
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
    }));

    const allItems = useLazyRef<Set<string>>(() => new Set()); // [...itemIds]
    const allGroups = useLazyRef<Map<string, Set<string>>>(() => new Map()); // groupId → [...itemIds]

    const {
      label,
      children,
      value,
      onValueChange,
      disablePointerSelection = false,
      ...etc
    } = props;

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
        setState: (key, value) => {
          if (Object.is(state.current[key], value)) return;
          state.current[key] = value;

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
        value: (id, value) => {},
        item: (id, groupId) => {
          allItems.current.add(id);

          if (groupId) {
            if (!allGroups.current.has(groupId)) {
              allGroups.current.set(groupId, new Set([id]));
            } else {
              allGroups.current.get(groupId)!.add(id);
            }
          }
          return () => {};
        },
        group: (id) => {
          return () => {};
        },
        label: label || props["aria-label"] || "",
        disablePointerSelection,
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

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      etc.onKeyDown?.(e);

      if (!e.defaultPrevented) {
        switch (e.key) {
          case "ArrowDown": {
            break;
          }
          case "ArrowUp": {
            break;
          }
          case "Home": {
            // First item
            e.preventDefault();
            break;
          }
          case "End": {
            // Last item
            e.preventDefault();
            break;
          }
          case 'Enter': {
            // Check if IME composition is finished before triggering onSelect
            // This prevents unwanted triggering while user is still inputting text with IME
            // e.keyCode === 229 is for the Japanese IME and Safari.
            // isComposing does not work with Japanese IME and Safari combination.
            if (!e.nativeEvent.isComposing && e.keyCode !== 229) {
              // Trigger item onSelect
              e.preventDefault()
              const item = getSelectedItem()
              if (item) {
                const event = new Event(SELECT_EVENT)
                item.dispatchEvent(event)
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
        kit-cmd-root
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

    React.useLayoutEffect(() => {
      return context!.item(id, groupContext!.id);
    }, []);

    const value = useValue(id, ref, [props.value, props.children, ref]);

    const store = useStore();
    const selected = useCmd(
      (state) => state.value && state.value === value.current
    );

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
        aria-disabled={Boolean(disabled)}
        aria-selected={Boolean(selected)}
        data-disabled={Boolean(disabled)}
        data-selected={Boolean(selected)}
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

    const contextValue = React.useMemo(() => ({ id }), []);

    return (
      <Primitive.div
        ref={mergeRefs([ref, forwardedRef])}
        {...etc}
        kit-cmd-group=""
      >
        {heading && (
          <div ref={headingRef} aria-hidden id={headingId}>
            {heading}
          </div>
        )}
        {SlottableWithNestedChildren(props, (child) => (
          <div role="group" aria-labelledby={heading ? headingId : undefined}>
            <GroupContext.Provider value={contextValue}>
              {child}
            </GroupContext.Provider>
          </div>
        ))}
      </Primitive.div>
    );
  }
);

const Separator = () => {
  return <Primitive.div></Primitive.div>;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, forwardedRef) => {
    const { onValueChange, ...etc } = props;
    const isControlled = props.value != null;
    const store = useStore();
    const search = useCmd((state) => state.search);
    const context = useCommand();

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
        aria-activedescendant={}
        id={context!.inputId}
        type="text"
        value={isControlled ? props.value : search}
        onChange={(e) => {
          if (!isControlled) {
            store!.setState("search", e.target.value);
          }
          onValueChange?.(e.target.value);
        }}
      />
    );
  }
);

const List = () => {
  return <Primitive.div></Primitive.div>;
};

const Result = () => {
  return <Primitive.div></Primitive.div>;
};

const Empty = () => {
  return <Primitive.div></Primitive.div>;
};

export { Command as CommandRoot };
export { Result as CommandResult };
export { List as CommandList };
export { Item as CommandItem };
export { Input as CommandInput };
export { Group as CommandGroup };
export { Separator as CommandSeparator };
export { Empty as CommandEmpty };

function useAsRef<T>(data: T) {
  const ref = React.useRef<T>(data);

  React.useLayoutEffect(() => {
    ref.current = data;
  });

  return ref;
}

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

  React.useLayoutEffect(() => {
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

  React.useLayoutEffect(() => {
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
